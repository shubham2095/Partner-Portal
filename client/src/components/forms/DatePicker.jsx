import { forwardRef } from 'react'
import Input from './Input'

const DatePicker = forwardRef(function DatePicker(props, ref) {
  return <Input ref={ref} type="date" {...props} />
})

export default DatePicker
