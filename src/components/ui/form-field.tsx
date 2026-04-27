"use client"

import type { FieldPath, FieldValues } from "react-hook-form"
import { Controller, type ControllerProps } from "react-hook-form"

import { FormFieldContext } from "./form-hook"

export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}