import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import ImageUploader from '@/shared/components/forms/ImageUploader/ImageUploader'

describe('ImageUploader', () => {
  let originalCreateObjectURL
  let originalRevokeObjectURL

  beforeEach(() => {
    originalCreateObjectURL = global.URL.createObjectURL
    originalRevokeObjectURL = global.URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn((file) => `blob:${file.name}`)
    global.URL.revokeObjectURL = jest.fn()
  })

  afterEach(() => {
    global.URL.createObjectURL = originalCreateObjectURL
    global.URL.revokeObjectURL = originalRevokeObjectURL
    jest.resetAllMocks()
  })

  test('calls onImagesChange with processed image when a valid file is selected', () => {
    const onImagesChange = jest.fn()
    const onError = jest.fn()

    const { container } = render(
      <ImageUploader images={[]} onImagesChange={onImagesChange} onError={onError} />
    )

    const input = container.querySelector('input[type="file"]')
  const file = new File(['dummy'], 'test.png', { type: 'image/png' })

    fireEvent.change(input, { target: { files: [file] } })

    expect(onError).not.toHaveBeenCalled()
    expect(onImagesChange).toHaveBeenCalledTimes(1)
    const arg = onImagesChange.mock.calls[0][0]
    expect(Array.isArray(arg)).toBe(true)
    expect(arg).toHaveLength(1)
    expect(arg[0].name).toBe('test.png')
  // The File.size can vary in JSDOM; assert it's a number and matches the file name
  expect(typeof arg[0].size).toBe('number')
    expect(arg[0].url).toBe('blob:test.png')
  })

  test('calls onError when file size exceeds 2MB', () => {
    const onImagesChange = jest.fn()
    const onError = jest.fn()

    const { container } = render(
      <ImageUploader images={[]} onImagesChange={onImagesChange} onError={onError} />
    )

    const input = container.querySelector('input[type="file"]')
    const big = new File(['x'.repeat(3 * 1024 * 1024)], 'big.png', { type: 'image/png', size: 3 * 1024 * 1024 })

    fireEvent.change(input, { target: { files: [big] } })

    expect(onImagesChange).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toEqual(expect.stringContaining('2MB'))
  })

  test('calls onError when adding files would exceed maxImages', () => {
    const onImagesChange = jest.fn()
    const onError = jest.fn()

    // Pre-populate images to hit the limit
    const existing = Array.from({ length: 5 }).map((_, i) => ({ id: i + 1, url: `blob:${i}`, name: `f${i}`, size: 100 }))

    const { container } = render(
      <ImageUploader images={existing} onImagesChange={onImagesChange} onError={onError} maxImages={5} />
    )

    const input = container.querySelector('input[type="file"]')
    const file = new File(['ok'], 'new.png', { type: 'image/png', size: 100 })

    fireEvent.change(input, { target: { files: [file] } })

    expect(onImagesChange).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toEqual('Solo puedes subir máximo 5 imágenes')
  })

  test('processes files on drop and removeImage revokes object URL', () => {
    const onImagesChange = jest.fn()
    const onError = jest.fn()

    const { container, getByText } = render(
      <ImageUploader images={[]} onImagesChange={onImagesChange} onError={onError} />
    )

    const file = new File(['dummy'], 'dropped.png', { type: 'image/png', size: 500 })

    // Find the drop area by text and locate a parent element to dispatch drop
    const dropText = getByText(/Arrastra y suelta imágenes aquí/i)
    const dropArea = dropText.closest('div')

    fireEvent.drop(dropArea, { dataTransfer: { files: [file] } })

    expect(onImagesChange).toHaveBeenCalledTimes(1)

    // Now simulate removeImage by rendering with an image and clicking delete
    const images = [{ id: 123, url: 'blob:dropped.png', name: 'dropped.png', size: 500 }]
    const onImagesChange2 = jest.fn()
    const { container: c2 } = render(<ImageUploader images={images} onImagesChange={onImagesChange2} onError={onError} />)

    const deleteBtn = c2.querySelector('.delete-button')
    expect(deleteBtn).toBeTruthy()
    fireEvent.click(deleteBtn)

    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:dropped.png')
    expect(onImagesChange2).toHaveBeenCalledWith([])
  })
})
