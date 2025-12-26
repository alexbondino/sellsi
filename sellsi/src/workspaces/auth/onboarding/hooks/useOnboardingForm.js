import { useState, useCallback } from 'react';
import { supabase } from '../../../../services/supabase';
import { validateRut, validateEmail } from '../../../../utils/validators';
import { useBanner } from '../../../../shared/components/display/banners/BannerContext';

/**
 * Hook personalizado para manejar el formulario de onboarding
 * Incluye validaciones y lógica para campos adicionales de proveedor
 */
export const useOnboardingForm = onClose => {
  const { showBanner } = useBanner();

  const [formData, setFormData] = useState({
    tipoCuenta: '',
    nombreEmpresa: '',
    nombrePersonal: '',
    telefonoContacto: '',
    codigoPais: 'CL', // Default to Chile

    // Campos de Documento Tributario
    documentTypes: [],

    // Campos de Facturación
    businessName: '',
    billingRut: '',
    businessLine: '',
    billingAddress: '',
    billingRegion: '',
    billingCommune: '',
  });

  const [loading, setLoading] = useState(false);

  /**
   * Actualiza un campo específico del formulario
   */
  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  /**
   * Maneja la selección del tipo de cuenta
   */
  const handleTypeSelect = useCallback(type => {
    setFormData(prev => ({
      ...prev,
      tipoCuenta: type,
    }));
  }, []);

  /**
   * Valida si el formulario está completo
   */
  const isFormValid = useCallback(() => {
    const hasBasicInfo =
      formData.tipoCuenta &&
      (formData.tipoCuenta === 'proveedor'
        ? formData.nombreEmpresa
        : formData.nombrePersonal) &&
      formData.telefonoContacto;

    // Si es proveedor y seleccionó factura, validar campos de facturación
    if (
      formData.tipoCuenta === 'proveedor' &&
      formData.documentTypes.includes('factura')
    ) {
      const hasBillingInfo =
        formData.businessName &&
        formData.billingRut &&
        validateRut(formData.billingRut) &&
        formData.businessLine &&
        formData.billingAddress &&
        formData.billingRegion &&
        formData.billingComuna;

      return hasBasicInfo && hasBillingInfo;
    }

    return hasBasicInfo;
  }, [formData]);

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = useCallback(
    async e => {
      e.preventDefault();

      if (!isFormValid()) {
        showBanner({
          message: 'Por favor completa todos los campos requeridos',
          severity: 'error',
        });
        return;
      }

      setLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        // Preparar datos básicos
        const updates = {
          user_nm:
            formData.tipoCuenta === 'proveedor'
              ? formData.nombreEmpresa
              : formData.nombrePersonal,
          main_supplier: formData.tipoCuenta === 'proveedor',
          phone_nbr: formData.telefonoContacto,
          country: formData.codigoPais,
          email: user.email,

          // Campos de documento tributario para proveedores
          ...(formData.tipoCuenta === 'proveedor' && {
            document_types: formData.documentTypes || [],
          }),

          // Campos de facturación si es proveedor y seleccionó factura
          ...(formData.tipoCuenta === 'proveedor' &&
            formData.documentTypes.includes('factura') && {
              business_name: formData.businessName,
              billing_rut: formData.billingRut,
              business_line: formData.businessLine,
              billing_address: formData.billingAddress,
              billing_region: formData.billingRegion,
              billing_comuna: formData.billingComuna,
            }),
        };

        const { error } = await supabase
          .from('users')
          .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' });

        if (error) {
          throw new Error(`Error al guardar el perfil: ${error.message}`);
        }

        showBanner({
          message: '¡Perfil completado exitosamente!',
          severity: 'success',
        });

        // Recargar para reflejar cambios
        setTimeout(() => {
          window.location.reload();
        }, 1000);

        onClose();
      } catch (error) {
        console.error('Error en onboarding:', error);
        showBanner({
          message: error.message || 'Error al completar el onboarding',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    },
    [formData, isFormValid, showBanner, onClose]
  );

  return {
    formData,
    loading,
    handleFieldChange,
    handleTypeSelect,
    isFormValid,
    handleSubmit,
  };
};
