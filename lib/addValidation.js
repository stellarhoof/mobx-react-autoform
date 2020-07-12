import _ from 'lodash/fp.js'
import F from 'futil/src/index.js'
import { extendObservable } from 'mobx'
import ValidatorJS from 'validatorjs'
import en from 'validatorjs/src/lang/en.js'
import { joinPaths, fieldId, mergeWithFns } from './util.js'

// https://github.com/skaterdav85/validatorjs/issues/227
ValidatorJS.setMessages('en', {
  ...en,
  accepted: 'You must accept the ":attribute"',
  required: 'This field is required',
})

export let validatorJS = ({ values, validates, path: parentPath, form }) => {
  let rules = _.pickBy(_.negate(_.isFunction), validates)
  let value = _.pick(_.keys(rules), values)
  let validator = new ValidatorJS(value, rules)
  let labels = F.mapValuesIndexed(
    (rule, path) => form.getField(joinPaths(parentPath, path)).label,
    rules
  )
  validator.setAttributeNames(labels)
  validator.fails() // Trigger validation
  return validator.errors.all()
}

export let fnsValidator = ({ values, validates }) => {
  let fns = _.pickBy(_.isFunction, validates)
  return mergeWithFns(_.pick(_.keys(fns), values), fns)
}

class ValidationError extends Error {
  constructor(errors) {
    super(`\n${JSON.stringify(errors, null, 2)}`)
    this.name = 'ValidationError'
  }
}

export let addValidation = ({ validators }) => (form) => {
  let submit = form.submit

  form.walkField()((field, path) => {
    F.defaultsOn({ label: _.startCase(path) }, field)
    F.defaultsOn({ component: {} }, field)
    F.defaultsOn(
      {
        onBlur: (e) => {
          if (e.target.id === fieldId({ path, form })) form.runValidation(path)
        },
      },
      field.component
    )
  })

  return extendObservable(form, {
    errors: {},
    runValidation: (path) => {
      let validates = _.flow(
        F.pickByIndexed(
          ({ hidden }, path) => !F.callOrReturn(hidden, { path, form })
        ),
        _.mapValues('validate'),
        F.compactObject
      )(form.flatField(path))

      let errors = F.mergeOverAll(validators)({
        values: form.flatValue(path),
        validates,
        path,
        form,
      })

      let fieldsErrors = _.flow(
        F.mapValuesIndexed((x, field) => errors[field]),
        _.mapValues(F.unless(_.isUndefined, _.castArray)),
        _.mapKeys(joinPaths(path))
      )(validates)

      F.mergeOn(form.errors, fieldsErrors)
      return F.compactObject(fieldsErrors)
    },
    submit: () => {
      let errors = form.runValidation()
      if (!_.isEmpty(errors)) throw new ValidationError(errors)
      return submit(form)
    },
  })
}
