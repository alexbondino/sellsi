import { useState, useMemo, useEffect } from 'react'

/**
 * Hook para manejar la lógica del selector de países
 * Separa la lógica de negocio de la presentación
 */
export const useCountrySelector = (initialValue = '') => {
  const [selectedCountry, setSelectedCountry] = useState(initialValue)
  const [searchTerm, setSearchTerm] = useState('')

  // Sincronizar con cambios externos del valor inicial (controlado por el padre)
  useEffect(() => {
    setSelectedCountry(initialValue || '')
  }, [initialValue])

  // Datos de países con códigos y nombres
  const allCountries = useMemo(
    () => [
      { code: 'CL', name: 'Chile +56', region: 'América del Sur' },
      { code: 'AR', name: 'Argentina +54', region: 'América del Sur' },
      { code: 'PE', name: 'Perú +51', region: 'América del Sur' },
      { code: 'CO', name: 'Colombia +57', region: 'América del Sur' },
      { code: 'MX', name: 'México +52', region: 'América del Norte' },
      { code: 'ES', name: 'España +34', region: 'Europa' },
      { code: 'US', name: 'EE.UU +1', region: 'América del Norte' },
      { code: 'EC', name: 'Ecuador +593', region: 'América del Sur' },
      { code: 'BO', name: 'Bolivia +591', region: 'América del Sur' },
      { code: 'UY', name: 'Uruguay +598', region: 'América del Sur' },
      { code: 'PY', name: 'Paraguay +595', region: 'América del Sur' },
      { code: 'VE', name: 'Venezuela +58', region: 'América del Sur' },
      { code: 'BR', name: 'Brasil +55', region: 'América del Sur' },
      { code: 'GT', name: 'Guatemala +502', region: 'América Central' },
      { code: 'CR', name: 'Costa Rica +506', region: 'América Central' },
      { code: 'PA', name: 'Panamá +507', region: 'América Central' },
    ],
    []
  )

  // Agrupar países por región
  const groupedCountries = useMemo(() => {
    const filtered = allCountries.filter((country) =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return filtered.reduce((groups, country) => {
      const region = country.region
      if (!groups[region]) {
        groups[region] = []
      }
      groups[region].push(country)
      return groups
    }, {})
  }, [allCountries, searchTerm])

  // Encontrar país seleccionado
  const selectedCountryData = useMemo(
    () => allCountries.find((country) => country.code === selectedCountry),
    [allCountries, selectedCountry]
  )

  const handleCountryChange = (countryCode) => {
    setSelectedCountry(countryCode)
  }

  const handleSearchChange = (term) => {
    setSearchTerm(term)
  }

  return {
    selectedCountry,
    selectedCountryData,
    searchTerm,
    allCountries,
    groupedCountries,
    handleCountryChange,
    handleSearchChange,
  }
}
