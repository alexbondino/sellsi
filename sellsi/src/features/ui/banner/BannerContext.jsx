import React, { createContext, useContext, useState } from 'react'

const BannerContext = createContext()

export const useBanner = () => {
  const context = useContext(BannerContext)
  if (!context) {
    throw new Error('useBanner debe usarse dentro de BannerProvider')
  }
  return context
}

export const BannerProvider = ({ children }) => {
  const [bannerState, setBannerState] = useState({
    show: false,
    message: '',
    severity: 'success',
    duration: 6000,
  })

  const showBanner = ({ message, severity = 'success', duration = 6000 }) => {
    setBannerState({
      show: true,
      message,
      severity,
      duration,
    })
  }

  const hideBanner = () => {
    setBannerState((prev) => ({ ...prev, show: false }))
  }

  return (
    <BannerContext.Provider
      value={{
        bannerState,
        showBanner,
        hideBanner,
      }}
    >
      {children}
    </BannerContext.Provider>
  )
}
