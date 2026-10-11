import Swal from 'sweetalert2'
import type { SweetAlertIcon } from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import './sweetalert.css'

const customClass = {
  popup: 'qassure-swal-popup',
  title: 'qassure-swal-title',
  htmlContainer: 'qassure-swal-text',
  confirmButton: 'qassure-swal-confirm',
  cancelButton: 'qassure-swal-cancel',
  input: 'qassure-swal-input',
}

export async function qaTextPrompt(options: {
  title: string
  label?: string
  initialValue?: string
  placeholder?: string
  textarea?: boolean
  confirmText?: string
}): Promise<string | null> {
  const result = await Swal.fire({
    title: options.title,
    input: options.textarea ? 'textarea' : 'text',
    inputLabel: options.label,
    inputValue: options.initialValue ?? '',
    inputPlaceholder: options.placeholder,
    showCancelButton: true,
    confirmButtonText: options.confirmText ?? 'Confirmar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    buttonsStyling: false,
    customClass,
    background: '#071b2e',
    color: '#eef8ff',
    inputValidator: (value: string) => value.trim().length < 2 ? 'Escribe al menos 2 caracteres.' : undefined,
  })

  if (!result.isConfirmed) return null
  const value = String(result.value ?? '').trim()
  return value || null
}

export async function qaSelect(options: {
  title: string
  label?: string
  options: Record<string, string>
  initialValue?: string
  confirmText?: string
}): Promise<string | null> {
  const result = await Swal.fire({
    title: options.title,
    input: 'select',
    inputLabel: options.label,
    inputOptions: options.options,
    inputValue: options.initialValue,
    showCancelButton: true,
    confirmButtonText: options.confirmText ?? 'Confirmar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    buttonsStyling: false,
    customClass,
    background: '#071b2e',
    color: '#eef8ff',
    inputValidator: (value: string) => !value ? 'Selecciona una opción.' : undefined,
  })

  if (!result.isConfirmed) return null
  return String(result.value ?? '') || null
}

export function qaToast(title: string, icon: SweetAlertIcon = 'success'): void {
  void Swal.fire({
    title,
    icon,
    toast: true,
    position: 'top-end',
    timer: 2400,
    timerProgressBar: true,
    showConfirmButton: false,
    customClass,
    background: '#071b2e',
    color: '#eef8ff',
  })
}
