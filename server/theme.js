import _ from 'lodash/fp.js'
import { bootstrap } from '@theme-ui/presets'

let { colors } = bootstrap

let disabled = {
  bg: colors.gray[1],
  cursor: 'default',
  borderColor: colors.gray[4],
}

let invalid = {
  borderColor: `${colors.danger} !important`,
}

let placeholder = {
  fontStyle: 'italic',
  color: 'textMuted',
}

export default _.merge(bootstrap, {
  global: {
    '.autoform-description': {
      color: colors.textMuted,
    },
    '.autoform-errors': {
      color: colors.danger,
    },
    '.autoform-invalid': {
      borderColor: `${colors.danger} !important`,
    },
  },
  forms: {
    input: {
      '&.invalid': invalid,
      '&:disabled': disabled,
      '&::placeholder': placeholder,
    },
    textarea: {
      '&.invalid': invalid,
      '&:disabled': disabled,
      '&::placeholder': placeholder,
    },
    select: {
      cursor: 'pointer',
      '&.invalid': invalid,
      '&:disabled': { ...disabled, opacity: 1 },
      '&::placeholder': { ...placeholder, borderColor: 'gray' },
    },
    checkbox: {
      '&.invalid': { ...invalid, color: `${colors.danger} !important` },
      '&:disabled': { ...disabled, color: colors.gray[4] },
    },
  },
})
