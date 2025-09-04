// Reusable style tokens and helpers for TopBar refactor (Fase 1)
export const focusReset = {
  outline: 'none',
  boxShadow: 'none',
  border: 'none',
  '&:focus': { outline: 'none', boxShadow: 'none', border: 'none' },
  '&:active': { outline: 'none', boxShadow: 'none', border: 'none' },
};

export const navButtonBase = {
  ...focusReset,
  textTransform: 'none',
  color: 'white',
  fontSize: 16,
  '&:hover': { outline: 'none', boxShadow: 'none', border: 'none' },
};

export const iconButtonBase = {
  ...focusReset,
  p: 0.4,
  minWidth: 36,
  minHeight: 36,
  transition: 'background 0.2s',
  '&:hover': {
    background: theme => theme.palette.primary.main,
    outline: 'none',
    border: 'none',
  },
};
