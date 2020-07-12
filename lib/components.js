import _ from 'lodash/fp.js'
import F from 'futil/src/index.js'
import { ThemeContext } from '@emotion/core'
import React from 'react'
import { observer } from 'mobx-react-lite'
import * as Theme from '@theme-ui/components'
import * as util from './util.js'

// Generic

export let defaultProps = _.curry((defaultProps, Component) => (props) => (
  <Component {..._.merge(defaultProps, props)} />
))

let statusMap = {
  failed: 'danger',
  succeeded: 'success',
  processing: '',
}

export let CommandButton = observer(
  function CommandButton({ command, children, disabled, ...props }, ref) {
    React.useEffect(() => {
      if (command.state.error) console.error(command.state.error)
    }, [command.state.error])
    return (
      <Theme.Button
        ref={ref}
        onClick={command}
        disabled={disabled || command.state.processing}
        sx={{ bg: _.get(command.state.status, statusMap) }}
        {...props}
      >
        {_.startCase(command.state.status) || children}
      </Theme.Button>
    )
  },
  { forwardRef: true }
)

// Layout

export let Flex = React.forwardRef(function Flex(
  { as: Component = Theme.Box, wrap, column, gap, inline, ...props },
  ref
) {
  let theme = React.useContext(ThemeContext)
  let gapPx = F.when(_.isNumber, `${theme.space[gap]} !important`, gap)
  return (
    <Component
      ref={ref}
      sx={{
        display: inline ? 'inline-flex' : 'flex',
        flexWrap: wrap && 'wrap',
        flexDirection: column && 'column',
        // https://sid.st/unpolished/flex-gap-polyfill/
        '& > * + *': column ? { marginTop: gapPx } : { marginLeft: gapPx },
        ...(wrap && {
          overflow: 'hidden',
          '& > *': column ? { marginRight: gapPx } : { marginBottom: gapPx },
          ...(column
            ? { marginRight: `-${gapPx}` }
            : { marginBottom: `-${gapPx}` }),
        }),
      }}
      {...props}
    />
  )
})

export let Grid = React.forwardRef(({ sx, ...props }, ref) => (
  <Theme.Grid ref={ref} sx={{ '& > *': { minWidth: 0 } }} {...props} />
))

// Controls

export let Checkbox = React.forwardRef(function Checkbox(
  { children, disabled, value, onChange, ...props },
  ref
) {
  let theme = React.useContext(ThemeContext)
  return (
    <Flex
      as={Theme.Label}
      sx={{
        alignItems: 'center',
        userSelect: 'none',
        cursor: 'pointer',
        width: 'fit-content',
        '& > div': { minWidth: 'unset' },
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <Theme.Checkbox
        ref={ref}
        checked={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        sx={disabled && _.get('forms.checkbox.&:disabled', theme)}
        {...props}
      />
      {children}
    </Flex>
  )
})

export let Select = React.forwardRef(function Select(
  { options, placeholder = 'Please Select...', value = '', ...props },
  ref
) {
  let theme = React.useContext(ThemeContext)
  return (
    <Theme.Select
      ref={ref}
      value={value}
      sx={value === '' && _.get('forms.select.&::placeholder', theme)}
      {...props}
    >
      <option value="">{placeholder}</option>
      {_.map(
        (x) => (
          <option key={x.value} value={x.value}>
            {x.label}
          </option>
        ),
        F.autoLabelOptions(options)
      )}
    </Theme.Select>
  )
})

let safeJson = {
  parse: (x) => (_.isString(x) && x !== '' ? JSON.parse(x) : x),
  stringify: (x) => (_.isUndefined(x) ? '' : JSON.stringify(x)),
}

export let ObjectSelect = React.forwardRef(function ObjectSelect(
  { value, onChange, options, ...props },
  ref
) {
  return (
    <Select
      ref={ref}
      value={safeJson.stringify(value)}
      onChange={(e) => onChange(safeJson.parse(e.target.value))}
      options={_.map(_.update('value', safeJson.stringify), options)}
      {...props}
    />
  )
})

export let CheckboxList = ({ value, onChange, options }) =>
  _.map(
    (option) => (
      <Checkbox
        key={option.value}
        value={_.includes(option.value, value)}
        onChange={(e) =>
          onChange(
            e.target.value
              ? F.push(option.value, value)
              : _.pull(option.value, value)
          )
        }
      >
        {option.label}
      </Checkbox>
    ),
    F.autoLabelOptions(options)
  )

// Layout

export let FormContext = React.createContext()

export let Form = React.forwardRef(function Form(
  { children, form, ...props },
  ref
) {
  return (
    <form ref={ref} noValidate onSubmit={(e) => e.preventDefault()} {...props}>
      <FormContext.Provider value={form}>{children}</FormContext.Provider>
    </form>
  )
})

export let Field = observer(
  function Field({ path = '', ...props }, ref) {
    let form = React.useContext(FormContext)
    let field = form.getField(path)
    let {
      hidden,
      description,
      hideLabel,
      label,
      validate,
      component = {},
    } = field
    let { as: Control, useEffect = _.noop, ...componentProps } = component

    React.useEffect(() => useEffect({ path, form, field }), [])

    if (F.callOrReturn(hidden, { path, form })) return null

    let isRoot = _.isEmpty(path)
    let id = util.fieldId({ path, form })
    let descriptionId = !hideLabel && description ? `${id}-description` : null
    let errors = _.get(path, form.errors)

    return (
      <div>
        {!hideLabel && (
          <Theme.Label htmlFor={id} sx={{ mb: isRoot ? 2 : 1 }}>
            <Theme.Heading as={isRoot ? 'h2' : 'h3'}>{label}</Theme.Heading>
          </Theme.Label>
        )}
        {descriptionId && (
          <div
            id={descriptionId}
            className="autoform-description"
            sx={{ mb: isRoot ? 3 : 2 }}
          >
            {description}
          </div>
        )}
        <Control
          ref={ref}
          id={id}
          className={!_.isEmpty(errors) ? 'autoform-invalid' : ''}
          aria-label={hideLabel && label}
          aria-describedby={descriptionId}
          {...{ path, form, field, validate }}
          {...componentProps}
          {...props}
        />
        <span className="autoform-errors" aria-live="polite">
          {F.compactJoin('\n', errors)}
        </span>
      </div>
    )
  },
  { forwardRef: true }
)

export let FieldList = ({ path, form, ...props }) => (
  <Flex column gap={3} {...props}>
    {F.mapIndexed(
      (field, name) => (
        <Field key={name} path={util.joinPaths(path, name)} />
      ),
      form.getField(path).fields
    )}
  </Flex>
)

let ResetButton = observer(
  function ResetButton(
    { onReset = _.noop, children = 'Reset', ...props },
    ref
  ) {
    let form = React.useContext(FormContext)
    return (
      <Theme.Button
        ref={ref}
        variant="secondary"
        disabled={_.get('state.processing', form.submit)}
        onClick={() => {
          form.reset()
          onReset()
        }}
        {...props}
      >
        {children || 'Reset'}
      </Theme.Button>
    )
  },
  { forwardRef: true }
)

let SubmitButton = observer(
  function SubmitButton(
    { onSuccess = _.noop, children = 'Submit', ...props },
    ref
  ) {
    let form = React.useContext(FormContext)
    return (
      <CommandButton
        ref={ref}
        type="submit"
        command={util.onCommandSuccess(() => {
          form.clean()
          onSuccess()
        })(form.submit)}
        {...props}
      >
        {children}
      </CommandButton>
    )
  },
  { forwardRef: true }
)

let FormError = observer(function FormError(props) {
  let form = React.useContext(FormContext)
  let { name, message } = form.submit.state.error || {}
  let error =
    name === 'ValidationError' ? 'There are validation errors' : message
  return !error ? null : (
    <div sx={{ fontWeight: 'medium', color: 'danger' }} {...props}>
      {error}
    </div>
  )
})

export let SimpleForm = ({
  onSuccess,
  onReset,
  submitLabel,
  resetLabel,
  form,
  ...props
}) => (
  <Flex
    {...props}
    column
    gap={4}
    as={Form}
    form={form}
    sx={{ alignItems: 'flex-end' }}
  >
    <Field />
    <Flex gap={3}>
      {(onReset || resetLabel) && (
        <ResetButton onReset={onReset}>{resetLabel}</ResetButton>
      )}
      <SubmitButton onSuccess={onSuccess}>{submitLabel}</SubmitButton>
    </Flex>
    <FormError />
  </Flex>
)
