import _ from 'lodash/fp.js'
import F from 'futil/src/index.js'
import React from 'react'
import { observer } from 'mobx-react-lite'
import * as Theme from '@theme-ui/components'
import * as Components from './components'

let FormControl = ({
  as: Component,
  encode = F.when(_.isUndefined, ''),
  decode = _.get('target.value'),
  mapProps = () => _.identity,
}) => {
  let Wrapped = ({ path, form, ...props }, ref) => {
    let { placeholder, ...rest } = mapProps({ path, form })(props)
    return (
      <Component
        ref={ref}
        value={encode(_.get(path, form.value))}
        onChange={(x) => F.setOn(path, decode(x), form.value)}
        placeholder={placeholder && `${placeholder}...`}
        {..._.omit('validate', rest)}
      />
    )
  }
  Wrapped.displayName = F.cascade(['displayName', 'name'], Component)
  return observer(Wrapped, { forwardRef: true })
}

export let Input = FormControl({
  as: Theme.Input,
})

let style = (sx) => _.update('sx', () => sx)

export let TextArea = FormControl({
  as: Theme.Textarea,
  mapProps: () => style({ minHeight: 100 }),
})

export let Checkbox = FormControl({
  as: Components.Checkbox,
  decode: _.identity,
})

export let DateInput = FormControl({
  as: Theme.Input,
  decode: (x) => x.target.valueAsDate,
  encode: (x) => x.toISOString().slice(0, 10),
  mapProps: () => _.set('type', 'date'),
})

export let DateTimeInput = FormControl({
  as: Theme.Input,
  decode: (x) => new Date(x.target.valueAsNumber),
  encode: (x) => x.toISOString().slice(0, -5),
  mapProps: () => _.set('type', 'datetime-local'),
})

let mapSelectProps = ({ path, form }) => ({ validate, options, ...props }) => ({
  ...props,
  options: F.callOrReturn(options, { path, form }),
  required: _.isString(validate) && validate.includes('required'),
})

export let Select = FormControl({
  as: Components.Select,
  mapProps: mapSelectProps,
})

export let ObjectSelect = FormControl({
  as: Components.ObjectSelect,
  decode: _.identity,
  mapProps: mapSelectProps,
})

export let CheckboxList = FormControl({
  as: Components.CheckboxList,
  encode: F.when(_.isUndefined, []),
  decode: _.identity,
  mapProps: mapSelectProps,
})
