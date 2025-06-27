import React, { useState } from 'react';
import {
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Box,
  Typography,
} from '@mui/material';
import {
  WarningAmber as WarningAmberIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  LocalShipping as LocalShippingIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

const Rows = ({ order, onActionClick }) => {
  const [expandedProducts, setExpandedProducts] = useState(false);

  // Formatear dirección
  const formatAddress = address => {
    return `${address.street}, ${address.city}, ${address.region}`;
  };

  // Formatear fecha
  const formatDate = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
  };

  // Formatear rango de fechas
  const formatDateRange = requestedDate => {
    const startDate = formatDate(requestedDate.start);
    const endDate = formatDate(requestedDate.end);
    return `${startDate} - ${endDate}`;
  };

  // Formatear moneda
  const formatCurrency = amount => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  // Obtener color del chip según estado
  const getStatusChipProps = status => {
    const statusConfig = {
      Pendiente: { color: 'warning', label: 'Pendiente' },
      Aceptado: { color: 'info', label: 'Aceptado' },
      'En Ruta': { color: 'secondary', label: 'En Ruta' },
      Entregado: { color: 'success', label: 'Entregado' },
      Pagado: { color: 'primary', label: 'Pagado' },
      Rechazado: { color: 'error', label: 'Rechazado' },
    };

    return statusConfig[status] || { color: 'default', label: status };
  };

  // Renderizar productos
  const renderProducts = () => {
    const { products } = order;
    const displayProducts = expandedProducts ? products : products.slice(0, 2);
    const hasMoreProducts = products.length > 2;

    return (
      <Box>
        {displayProducts.map((product, index) => (
          <Typography key={index} variant="body2" component="div">
            {product.name} x {product.quantity}
          </Typography>
        ))}

        {hasMoreProducts && !expandedProducts && (
          <Typography variant="body2" color="text.secondary">
            ...y {products.length - 2} más
          </Typography>
        )}

        {hasMoreProducts && (
          <IconButton
            size="small"
            onClick={() => setExpandedProducts(!expandedProducts)}
          >
            {expandedProducts ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>
    );
  };

  // Renderizar acciones según estado
  const renderActions = () => {
    const { status } = order;

    const actions = [];

    switch (status) {
      case 'Pendiente':
        actions.push(
          <Tooltip key="accept" title="Aceptar">
            <IconButton
              color="success"
              onClick={() => onActionClick(order, 'accept')}
            >
              <CheckIcon />
            </IconButton>
          </Tooltip>,
          <Tooltip key="reject" title="Rechazar">
            <IconButton
              color="error"
              onClick={() => onActionClick(order, 'reject')}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>,
          <Tooltip key="chat" title="Chat">
            <IconButton
              color="primary"
              onClick={() => onActionClick(order, 'chat')}
            >
              <ChatBubbleOutlineIcon />
            </IconButton>
          </Tooltip>
        );
        break;

      case 'Aceptado':
        actions.push(
          <Tooltip key="dispatch" title="Despachar">
            <IconButton
              color="primary"
              onClick={() => onActionClick(order, 'dispatch')}
            >
              <LocalShippingIcon />
            </IconButton>
          </Tooltip>,
          <Tooltip key="reject" title="Rechazar">
            <IconButton
              color="error"
              onClick={() => onActionClick(order, 'reject')}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>,
          <Tooltip key="chat" title="Chat">
            <IconButton
              color="primary"
              onClick={() => onActionClick(order, 'chat')}
            >
              <ChatBubbleOutlineIcon />
            </IconButton>
          </Tooltip>
        );
        break;

      case 'En Ruta':
        actions.push(
          <Tooltip key="deliver" title="Confirmar Entrega">
            <IconButton
              color="success"
              onClick={() => onActionClick(order, 'deliver')}
            >
              <AssignmentTurnedInIcon />
            </IconButton>
          </Tooltip>,
          <Tooltip key="reject" title="Rechazar">
            <IconButton
              color="error"
              onClick={() => onActionClick(order, 'reject')}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>,
          <Tooltip key="chat" title="Chat">
            <IconButton
              color="primary"
              onClick={() => onActionClick(order, 'chat')}
            >
              <ChatBubbleOutlineIcon />
            </IconButton>
          </Tooltip>
        );
        break;

      case 'Entregado':
      case 'Pagado':
        actions.push(
          <Tooltip key="chat" title="Chat">
            <IconButton
              color="primary"
              onClick={() => onActionClick(order, 'chat')}
            >
              <ChatBubbleOutlineIcon />
            </IconButton>
          </Tooltip>
        );
        break;

      case 'Rechazado':
        // No hay acciones disponibles
        break;
    }

    return actions;
  };

  // Determinar si debe mostrar fecha de entrega
  const shouldShowDeliveryDate = () => {
    return ['En Ruta', 'Entregado', 'Pagado'].includes(order.status);
  };

  const statusChipProps = getStatusChipProps(order.status);

  return (
    <TableRow hover>
      {/* Columna de Advertencia */}
      <TableCell align="center">
        {order.isLate && (
          <Tooltip title="Atrasado">
            <WarningAmberIcon color="warning" />
          </Tooltip>
        )}
      </TableCell>

      {/* Columna Productos */}
      <TableCell>{renderProducts()}</TableCell>

      {/* Columna ID Venta */}
      <TableCell>
        <Typography variant="body2" fontWeight="medium">
          {order.order_id}
        </Typography>
      </TableCell>

      {/* Columna Dirección Entrega */}
      <TableCell>
        <Typography variant="body2">
          {formatAddress(order.deliveryAddress)}
        </Typography>
      </TableCell>

      {/* Columna Fecha Solicitada */}
      <TableCell>
        <Typography variant="body2">
          {formatDateRange(order.requestedDate)}
        </Typography>
      </TableCell>

      {/* Columna Fecha Entrega */}
      <TableCell>
        {shouldShowDeliveryDate() && order.estimated_delivery_date && (
          <Typography variant="body2">
            {formatDate(order.estimated_delivery_date)}
          </Typography>
        )}
      </TableCell>

      {/* Columna Venta */}
      <TableCell align="right">
        <Typography variant="body2" fontWeight="medium">
          {formatCurrency(order.total_amount)}
        </Typography>
      </TableCell>

      {/* Columna Estado */}
      <TableCell>
        <Chip
          label={statusChipProps.label}
          color={statusChipProps.color}
          size="small"
        />
      </TableCell>

      {/* Columna Acciones */}
      <TableCell>
        <Box sx={{ display: 'flex', gap: 0.5 }}>{renderActions()}</Box>
      </TableCell>
    </TableRow>
  );
};

export default Rows;
