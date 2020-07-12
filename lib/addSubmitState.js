import F from 'futil/src/index.js'
import { extendObservable } from 'mobx'

export default (form) => {
  form.submit = F.aspects.command((x) => (y) => extendObservable(y, x))(
    form.submit
  )
  return form
}
