import './shims.js'
import 'mobx-react-lite/batchingForReactDom.js'
import _ from 'lodash/fp.js'
import React from 'react'
import ReactDOM from 'react-dom'
import { ThemeProvider } from '@theme-ui/core'
import { Global } from '@emotion/core'
import autoform from '@lib/index.js'
import { addValidation, validatorJS, fnsValidator } from '@lib/addValidation.js'
import addSubmitState from '@lib/addSubmitState.js'
import { SimpleForm, Flex } from '@lib/components.js'
import quoteRequestForm from './forms/quoteRequest.js'
import theme from './theme.js'

let Form = ({ config }) => {
  let form = _.flow(
    autoform,
    addValidation({ validators: [validatorJS, fnsValidator] }),
    addSubmitState
  )(config)
  return (
    <SimpleForm
      form={form}
      submitLabel="Save"
      resetLabel="Reset"
      sx={{ width: 600 }}
    />
  )
}

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={_.omit('global', theme)}>
      <Global styles={theme.global} />
      <Flex
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          margin: '24px 0',
        }}
      >
        <Form config={quoteRequestForm} />
      </Flex>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
)

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/#hot-module-replacement
if (import.meta.hot) {
  import.meta.hot.accept()
}
