// Configuración centralizada de pasos del wizard de autenticación.
// Se evita re-exportar cada Step desde un barrel para reducir fan-out y riesgo de ciclos.

export const authWizardSteps = [
  {
    id: 'step1Account',
    component: () => import('./Step1Account'),
    type: 'register',
  },
  {
    id: 'step2AccountType',
    component: () => import('./Step2AccountType'),
    type: 'register',
  },
  {
    id: 'step3Profile',
    component: () => import('./Step3Profile'),
    type: 'register',
  },
  {
    id: 'step4Verification',
    component: () => import('./Step4Verification'),
    type: 'register',
  },
];

export const recoveryWizardSteps = [
  {
    id: 'step1Email',
    component: () => import('./Step1Email'),
    type: 'recovery',
  },
  { id: 'step2Code', component: () => import('./Step2Code'), type: 'recovery' },
  {
    id: 'step3Reset',
    component: () => import('./Step3Reset'),
    type: 'recovery',
  },
];

export const loadWizardStep = async stepId => {
  const all = [...authWizardSteps, ...recoveryWizardSteps];
  const target = all.find(s => s.id === stepId);
  if (!target) throw new Error(`Wizard step not found: ${stepId}`);
  const mod = await target.component();
  return mod.default || mod;
};

export default { authWizardSteps, recoveryWizardSteps, loadWizardStep };
