import React, { useMemo, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material'
import { InfoOutlined as InfoIcon } from '@mui/icons-material'
import { useBanner } from '../../../shared/components/display/banners/BannerContext'

const OfferModal = ({ open, onClose, onOffer, stock = 0, defaultPrice = '', product = null }) => {
  const [price, setPrice] = useState(defaultPrice === '' ? '' : String(defaultPrice))
  const [quantity, setQuantity] = useState('')
  const [errors, setErrors] = useState({ price: '', quantity: '' })

  useEffect(() => {
    if (open) {
      // reset when opened
      setPrice(defaultPrice === '' ? '' : String(defaultPrice))
      setQuantity('')
      setErrors({ price: '', quantity: '' })
    }
  }, [open, defaultPrice])

  const total = useMemo(() => {
    const p = parseFloat(price || 0) || 0
    const q = parseInt(quantity || '0', 10) || 0
    return p * q
  }, [price, quantity])

  const validate = () => {
    const next = { price: '', quantity: '' }
    const p = parseFloat(price)
    const q = parseInt(quantity, 10)

    if (Number.isNaN(p) || price === '') next.price = 'Ingresa un precio válido'
    else if (p <= 0) next.price = 'El precio debe ser mayor a 0'
    else if (p >= 1000000) next.price = 'El precio debe ser menor a 1.000.000'

    if (!Number.isInteger(q) || Number.isNaN(q) || quantity === '') next.quantity = 'Ingresa una cantidad válida'
    else if (q <= 0) next.quantity = 'La cantidad debe ser mayor a 0'
    else if (q > stock) next.quantity = `La cantidad no puede superar el stock (${stock})`

    setErrors(next)
    return !next.price && !next.quantity
  }

  const { showBanner } = useBanner()

  const handleOffer = async () => {
    if (!validate()) return
    const p = parseFloat(price)
    const q = parseInt(quantity, 10)

    try {
      const res = onOffer ? onOffer({ price: p, quantity: q, product }) : null
      // if onOffer returns a Promise, wait for it
      if (res && typeof res.then === 'function') await res

      showBanner({
        message: "Tu oferta ha sido creada correctamente. Revisa 'Mis Ofertas' para ver su estado.",
        severity: 'success',
        duration: 6000,
      })

      onClose && onClose()
    } catch (err) {
      // show error banner and keep modal open so user can retry
      showBanner({
        message: 'No fue posible crear la oferta. Intenta de nuevo más tarde.',
        severity: 'error',
        duration: 6000,
      })
      // optionally rethrow or log the error elsewhere
    }
  }

  // helpers to keep only numeric input
  const onChangePrice = (ev) => {
    // allow decimals and commas
    const raw = ev.target.value.replace(/,/g, '.')
    // allow digits and a single dot
    if (/^\d*(?:\.\d{0,2})?$/.test(raw) || raw === '') {
      setPrice(raw)
      if (errors.price) setErrors((s) => ({ ...s, price: '' }))
    }
  }

  const onChangeQuantity = (ev) => {
    const raw = ev.target.value.replace(/[^0-9]/g, '')
    setQuantity(raw)
    if (errors.quantity) setErrors((s) => ({ ...s, quantity: '' }))
  }

  const formattedTotal = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(total)
  const displayTotal = (typeof formattedTotal === 'string' && formattedTotal.length > 18)
    ? `${formattedTotal.slice(0, 18)}...`
    : formattedTotal

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" disableScrollLock={true} disableRestoreFocus={true}>
      <DialogTitle>
        Ingresa Precio y Cantidad
      </DialogTitle>

      {/* Form wrapper with autocomplete off to prevent browser saved data */}
      <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); handleOffer(); }}>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'flex-start' }}>
            <TextField
              label="Precio"
              value={price}
              onChange={onChangePrice}
              autoComplete="off"
              inputProps={{ inputMode: 'decimal', autoComplete: 'new-password', name: 'offer-price' }}
              helperText={errors.price || ''}
              error={!!errors.price}
              fullWidth
            />

            <TextField
              label="Cantidad"
              value={quantity}
              onChange={onChangeQuantity}
              autoComplete="off"
              inputProps={{ inputMode: 'numeric', autoComplete: 'new-password', name: 'offer-quantity' }}
              helperText={errors.quantity || ''}
              error={!!errors.quantity}
              fullWidth
            />
          </Box>

          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2">Stock disponible: {stock}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" component="div" sx={{ color: 'text.primary', fontWeight: 500, textAlign: 'left' }}>Total a pagar:</Typography>
              <Typography variant="body2" component="div" title={formattedTotal} sx={{ fontWeight: 600, color: 'text.primary', textAlign: 'left', fontSize: '1.125rem' }}>{displayTotal}</Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            <Typography variant="caption">El proveedor tendra un maximo de 48 horas para aceptar/rechazar tu oferta.</Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', gap: 2, px: 3 }}>
          <Button type="button" onClick={onClose} color="inherit" sx={{ minWidth: 120 }}>Cancelar</Button>
          <Button type="submit" variant="contained" sx={{ minWidth: 140 }} disabled={!price || !quantity || !!errors.price || !!errors.quantity}>Ofertar</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

OfferModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onOffer: PropTypes.func,
  stock: PropTypes.number,
  defaultPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  product: PropTypes.any,
}

export default OfferModal
