import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileImageModal from '../../shared/components/modals/ProfileImageModal';

describe('ProfileImageModal', () => {
  const onClose = jest.fn();
  let originalCreateObjectURL;
  let originalRevokeObjectURL;
  beforeAll(() => {
    originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = jest.fn(() => 'blob:mock');
    // Provide a noop revoke to avoid TypeError in jsdom when code calls revoke
    originalRevokeObjectURL = URL.revokeObjectURL;
    URL.revokeObjectURL = jest.fn();
  });
  afterAll(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows validation error for non-image file and disables save', async () => {
    render(
      <ProfileImageModal open={true} onClose={onClose} onImageChange={() => {}} currentImageUrl={null} />
    );

    // create a non-image fake file
    const file = new File(['hello'], 'doc.txt', { type: 'text/plain' });

    // fire change
    const fileInput = screen.getByTestId('profile-image-input');
    await userEvent.upload(fileInput, file);

    // Save should be disabled and filename must NOT appear
    expect(screen.getByRole('button', { name: /Guardar/i })).toBeDisabled();
    expect(screen.queryByText(/doc\.txt/i)).not.toBeInTheDocument();
  });

  test('shows validation error for oversized file', async () => {
    render(
      <ProfileImageModal open={true} onClose={onClose} onImageChange={() => {}} currentImageUrl={null} />
    );

    const big = new File([new ArrayBuffer(400 * 1024)], 'big.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type=file]');
    await userEvent.upload(fileInput, big);

    expect(await screen.findByText(/La imagen debe ser menor a 300KB/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar/i })).toBeDisabled();
  });

  test('handles createObjectURL throwing and shows graceful error', async () => {
    const original = URL.createObjectURL;
    URL.createObjectURL = () => { throw new Error('boom'); };

    render(
      <ProfileImageModal open={true} onClose={onClose} onImageChange={() => {}} currentImageUrl={null} />
    );

    const file = new File(['x'], 'small.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type=file]');
    await userEvent.upload(fileInput, file);

    expect(await screen.findByText(/No se pudo procesar la imagen/i)).toBeInTheDocument();
    URL.createObjectURL = original;
  });

  test('calls onSaveImage with file on successful save (auto-save path)', async () => {
    const onSaveImage = jest.fn().mockResolvedValue(undefined);
    const handleClose = jest.fn();

    render(
      <ProfileImageModal open={true} onClose={handleClose} onImageChange={() => {}} currentImageUrl={null} onSaveImage={onSaveImage} />
    );

    const file = new File(['x'], 'small.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type=file]');
    await userEvent.upload(fileInput, file);

    // Save should be enabled
    const saveBtn = screen.getByRole('button', { name: /Guardar/i });
    expect(saveBtn).toBeEnabled();

    // Click save and await call
    fireEvent.click(saveBtn);
    await waitFor(() => expect(onSaveImage).toHaveBeenCalledWith(expect.any(File)));
    expect(handleClose).toHaveBeenCalled();
  });

  test('save when delete pending calls onSaveImage with null', async () => {
    const onSaveImage = jest.fn().mockResolvedValue(undefined);
    const handleClose = jest.fn();

    render(
      <ProfileImageModal open={true} onClose={handleClose} onImageChange={() => {}} currentImageUrl={'https://cdn/test.png'} onSaveImage={onSaveImage} />
    );

    // Click the delete current image button (Tooltip title)
    const deleteBtn = screen.queryByTitle('Eliminar imagen actual') || screen.getByTestId('profile-image-delete-current');
    fireEvent.click(deleteBtn);

    // Now Save should be enabled
    const saveBtn = screen.getByRole('button', { name: /Guardar/i });
    expect(saveBtn).toBeEnabled();

    fireEvent.click(saveBtn);
    await waitFor(() => expect(onSaveImage).toHaveBeenCalledWith(null));
    expect(handleClose).toHaveBeenCalled();
  });

  test('rejects gif files as invalid type', async () => {
    render(<ProfileImageModal open={true} onClose={jest.fn()} onImageChange={() => {}} currentImageUrl={null} />);

    const file = new File(['g'], 'anim.gif', { type: 'image/gif' });
    const fileInput = screen.getByTestId('profile-image-input');
    await userEvent.upload(fileInput, file);

    // Validation should block the file and not show the filename
    expect(screen.getByRole('button', { name: /Guardar/i })).toBeDisabled();
    expect(screen.queryByText(/anim\.gif/i)).not.toBeInTheDocument();
  });

  test('shows loading state while onSaveImage pending', async () => {
    let resolver;
    const onSaveImage = jest.fn().mockImplementation(() => new Promise(resolve => { resolver = resolve; }));
    const handleClose = jest.fn();

    render(<ProfileImageModal open={true} onClose={handleClose} onImageChange={() => {}} currentImageUrl={null} onSaveImage={onSaveImage} />);

    const file = new File(['x'], 'small.png', { type: 'image/png' });
    const fileInput = screen.getByTestId('profile-image-input');
    await userEvent.upload(fileInput, file);

    const saveBtn = screen.getByRole('button', { name: /Guardar/i });
    fireEvent.click(saveBtn);

    // Button should show loading state and be disabled
    await waitFor(() => expect(saveBtn).toHaveTextContent(/Guardando.../i));
    expect(saveBtn).toBeDisabled();

    // resolve and ensure close called afterwards
    act(() => resolver());
    await waitFor(() => expect(handleClose).toHaveBeenCalled());
  });

  test('shows error when onSaveImage rejects and keeps modal open', async () => {
    const onSaveImage = jest.fn().mockRejectedValue(new Error('upload failed'));
    const handleClose = jest.fn();

    render(<ProfileImageModal open={true} onClose={handleClose} onImageChange={() => {}} currentImageUrl={null} onSaveImage={onSaveImage} />);

    const file = new File(['x'], 'small.png', { type: 'image/png' });
    const fileInput = screen.getByTestId('profile-image-input');
    await userEvent.upload(fileInput, file);

    const saveBtn = screen.getByRole('button', { name: /Guardar/i });
    fireEvent.click(saveBtn);

    // Error should be shown and modal not closed
    await waitFor(() => expect(screen.getByText(/upload failed|Error al guardar la imagen/i)).toBeInTheDocument());
    expect(handleClose).not.toHaveBeenCalled();
  });

  test('remove selected image disables save', async () => {
    render(<ProfileImageModal open={true} onClose={jest.fn()} onImageChange={() => {}} currentImageUrl={null} />);

    const file = new File(['x'], 'small.png', { type: 'image/png' });
    const fileInput = screen.getByTestId('profile-image-input');
    await userEvent.upload(fileInput, file);

    // Ensure selected info shown and save enabled
    expect(await screen.findByText(/small\.png/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar/i })).toBeEnabled();

    // Click remove
    const removeBtn = screen.getByTestId('profile-image-remove-selected');
    fireEvent.click(removeBtn);

    // Save should be disabled and selected info removed
    expect(screen.getByRole('button', { name: /Guardar/i })).toBeDisabled();
    expect(screen.queryByText('small.png')).not.toBeInTheDocument();
  });

  test('shows preview and enables save for valid small png', async () => {
    render(<ProfileImageModal open={true} onClose={jest.fn()} onImageChange={() => {}} currentImageUrl={null} />);

    const file = new File(['x'], 'small.png', { type: 'image/png' });
    const fileInput = screen.getByTestId('profile-image-input');
    await userEvent.upload(fileInput, file);

    expect(await screen.findByText(/small\.png/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar/i })).toBeEnabled();
  });

});
