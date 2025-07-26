import { useState, useMemo } from 'react'

/**
 * Hook para manejar la lógica del selector de países
 * Separa la lógica de negocio de la presentación
 */
export const useCountrySelector = (initialValue = '') => {
  const [selectedCountry, setSelectedCountry] = useState(initialValue)
  const [searchTerm, setSearchTerm] = useState('')

  // Datos de países con códigos y nombres
  const allCountries = useMemo(
    () => [
      { code: 'CL', name: 'Chile', region: 'América del Sur' },
      { code: 'AR', name: 'Argentina', region: 'América del Sur' },
      { code: 'PE', name: 'Perú', region: 'América del Sur' },
      { code: 'CO', name: 'Colombia', region: 'América del Sur' },
      { code: 'MX', name: 'México', region: 'América del Norte' },
      { code: 'ES', name: 'España', region: 'Europa' },
      { code: 'US', name: 'Estados Unidos', region: 'América del Norte' },
      { code: 'EC', name: 'Ecuador', region: 'América del Sur' },
      { code: 'BO', name: 'Bolivia', region: 'América del Sur' },
      { code: 'UY', name: 'Uruguay', region: 'América del Sur' },
      { code: 'PY', name: 'Paraguay', region: 'América del Sur' },
      { code: 'VE', name: 'Venezuela', region: 'América del Sur' },
      { code: 'BR', name: 'Brasil', region: 'América del Sur' },
      { code: 'GT', name: 'Guatemala', region: 'América Central' },
      { code: 'CR', name: 'Costa Rica', region: 'América Central' },
      { code: 'PA', name: 'Panamá', region: 'América Central' },
    ],
    []
  )

  // Colores de banderas para el componente visual
  const flagColors = useMemo(
    () => ({
      CL: ['#0033A0', '#ffffff', '#DA020E'],
      AR: ['#75aadb', '#ffffff', '#75aadb'],
      PE: ['#d52b1e', '#ffffff'],
      CO: ['#fcdd09', '#003893', '#ce1126'],
      MX: ['#006847', '#ffffff', '#ce1126'],
      ES: ['#c60b1e', '#ffc400'],
      US: ['#B22234', '#ffffff', '#3C3B6E'],
      EC: ['#ffdd00', '#0072ce', '#ef3340'],
      BO: ['#d52b1e', '#ffdd00', '#007934'],
      UY: ['#0038a8', '#ffffff', '#0038a8'],
      PY: ['#d52b1e', '#ffffff', '#0038a8'],
      VE: ['#ffcc00', '#003893', '#cf142b'],
      BR: ['#009739', '#ffdf00'],
      GT: ['#4997d0', '#ffffff'],
      CR: ['#0038a8', '#ffffff', '#ce1126'],
      PA: ['#ffffff', '#da020e', '#0073ce'],
    }),
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
    flagColors,
    handleCountryChange,
    handleSearchChange,
  }
}
