import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';

const getTimeAgo = timestamp => {
  const now = new Date();
  const created = new Date(timestamp);
  if (isNaN(created)) return 'Fecha inválida';

  const diffMs = now - created;
  if (diffMs < 0) return 'Menos de 1 minuto';

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / (3600000 * 24));

  if (diffMins < 1) return 'Menos de 1 minuto';
  if (diffMins < 60)
    return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
  if (diffHours < 24)
    return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
};

const RequestList = ({ weeklyRequests = [] }) => {
  const requests = Array.isArray(weeklyRequests) ? weeklyRequests : [];

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ pb: 1 }}>
        <Typography
          component="h2"
          variant="h6"
          sx={{
            mb: 2,
            fontWeight: 600,
            color: 'text.primary',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: '0.9rem',
          }}
        >
          <ShoppingCartIcon sx={{ fontSize: 20 }} />
          Solicitudes Recientes
        </Typography>
        {requests.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 6,
              px: 2,
            }}
          >
            <InventoryIcon
              sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }}
            />
            <Typography
              variant="body2"
              align="center"
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              No hay solicitudes esta semana
            </Typography>
            <Typography
              variant="caption"
              align="center"
              color="text.disabled"
              sx={{ mt: 0.5 }}
            >
              Las nuevas solicitudes aparecerán aquí
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, maxHeight: 400, overflowY: 'auto' }}>
            {requests.map((req, index) => (
              <React.Fragment key={index}>
                <ListItem
                  sx={{
                    px: 0,
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      borderRadius: 1,
                    },
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}
                    >
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, color: 'text.primary' }}
                        >
                          {req.seller?.user_nm || 'Cliente'}
                        </Typography>
                        <Chip
                          label={`${req.productqty ?? 'N/A'} und.`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Stack spacing={0.5}>
                        <Typography
                          variant="body2"
                          sx={{ color: 'text.secondary', fontWeight: 500 }}
                        >
                          {req.product?.productnm || 'Producto sin nombre'}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.disabled', fontSize: '0.7rem' }}
                        >
                          {getTimeAgo(req.createddt)}
                        </Typography>
                      </Stack>
                    }
                  />
                </ListItem>
                {index < requests.length - 1 && (
                  <Divider variant="inset" component="li" sx={{ ml: 7 }} />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default RequestList;
