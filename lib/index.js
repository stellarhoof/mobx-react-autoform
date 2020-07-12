import _ from 'lodash/fp.js'
import F from 'futil/src/index.js'
import { observable, toJS } from 'mobx'
import {
  treePath,
  dotTreePath,
  flattenTree,
  flattenTreeLeaves,
  unmerge,
} from './util.js'

export let fieldPath = (path) =>
  _.reduce(
    (path, x) =>
      _.isNaN(parseInt(x)) ? [...path, 'fields', x] : [...path, 'itemField'],
    [],
    _.split('.', path)
  )

let toJSDeep = (x) => toJS(x, { recurseEverything: true })

// NOTE: If a nested value is changed, its parents are not detected as dirty

let getValue = (path, obj) => _.get(path ? `value.${path}` : 'value', obj)

let setValue = (path, value, obj) =>
  F.setOn(path ? `value.${path}` : 'value', value, obj)

// Custom traversal function for form fields
// If field is an array field, return an array of itemFields the same size as
// the size of the array value so we can keep iterating. Otherwise return
// nested object fields
let traverse = (value) => (field, ...xs) => {
  if (!field) return
  if (field.itemField)
    return _.times(
      _.constant(field.itemField),
      _.size(_.get(treePath(field, ...xs), value))
    )
  return field.fields
}

export let formValues = (form) => {
  let flatLeaves = flattenTreeLeaves(traverse(form.value))()(form.getField())
  let defaultValues = F.mapValuesIndexed(
    (field, path) => F.callOrReturn(field.value, { path, form }),
    _.omit('', form.flatField())
  )
  return _.flow(
    _.pick(_.keys(flatLeaves)),
    _.merge(defaultValues),
    _.pickBy(_.negate(_.isUndefined)),
    F.unflattenObject
  )(form.flatValue())
}

export default ({ value = {}, ...config }) => {
  let saved = observable({
    getValue: (path) => getValue(path, saved),
    setValue: (path, value) => setValue(path, value, saved),
  })

  let form = observable({
    value,
    getValue: (path) => getValue(path, form),
    setValue: _.curry((path, value) => setValue(path, value, form)),
    flatValue: (path) => flattenTree()()(form.getValue(path)),
    isDirty: (path) => !_.isEqual(saved.getValue(path), form.getValue(path)),
    reset: (path) => form.setValue(path, toJSDeep(saved.getValue(path))),
    clean: (path) => saved.setValue(path, toJSDeep(form.getValue(path))),
    getPatch: (path) => unmerge(saved.getValue(path), form.getValue(path)),
    getField: (path) => (_.isEmpty(path) ? form : _.get(fieldPath(path), form)),
    flatField: (path) =>
      flattenTree(traverse(form.getValue(path)))()(form.getField(path)),
    walkField: (path) => (fn) =>
      F.walk(traverse(form.getValue(path)))((field, ...xs) => {
        fn(field, dotTreePath(field, ...xs))
      })(form.getField(path)),
    ...config,
  })

  let values = formValues(form)
  form.value = values
  saved.value = values

  return form
}
