import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import {
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Stack,
  Tooltip,
  Chip,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  LinearProgress,
  Alert
} from '@mui/material';
import { ArrowBack, Refresh, QueryStats, Timeline, ErrorOutline, Speed, Insights } from '@mui/icons-material';
import { LineChart, BarChart } from '@mui/x-charts';

const palette = {
  primary: '#1976d2',
  error: '#d32f2f',
  success: '#2e7d32',
  warning: '#ed6c02',
  info: '#0288d1'
};

const RANGE_OPTIONS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 }
];

function a11yProps(index) { return { id: `metrics-tab-${index}`, 'aria-controls': `metrics-tabpanel-${index}` }; }

const AdminMetrics = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [range, setRange] = useState(RANGE_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fnDaily, setFnDaily] = useState([]);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - range.days);
      const { data: edgeData, error: edgeErr } = await supabase
        .from('vw_edge_function_daily_ext')
        .select('*')
        .order('day', { ascending: true });
      if (edgeErr) throw edgeErr;
      const filteredEdge = (edgeData||[]).filter(r => new Date(r.day) >= fromDate);
      setFnDaily(filteredEdge);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); // eslint-disable-next-line
  }, [range.days]);

  const functions = useMemo(() => {
    const set = new Set(fnDaily.map(r => r.function_name));
    return Array.from(set).sort();
  }, [fnDaily]);

  const totals = useMemo(() => {
    const m = {};
    fnDaily.forEach(r => {
      if (!m[r.function_name]) m[r.function_name] = { inv:0, err:0, sumDur:0, days:0 };
      m[r.function_name].inv += r.invocations;
      m[r.function_name].err += r.errors;
      m[r.function_name].sumDur += (r.avg_duration_ms || 0);
      m[r.function_name].days += 1;
    });
    return m;
  }, [fnDaily]);

  const handleTabChange = (_, v) => setTab(v);
  const handleRange = (_, val) => {
    if (!val) return;
    const opt = RANGE_OPTIONS.find(o => o.label === val);
    if (opt) setRange(opt);
  };

  const TabPanel = ({ index, children }) => (
    <div role="tabpanel" hidden={tab !== index} id={`metrics-tabpanel-${index}`} aria-labelledby={`metrics-tab-${index}`}>{tab === index && (<Box sx={{ pt: 3 }}>{children}</Box>)}</div>
  );

  const lineSeries = (fn) => [
    { data: fnDaily.filter(r=>r.function_name===fn).map(r=>r.avg_duration_ms||0), label: 'Avg', color: palette.primary },
    { data: fnDaily.filter(r=>r.function_name===fn).map(r=>r.p95_duration_ms||0), label: 'p95', color: palette.warning },
  ];
  const lineX = (fn) => fnDaily.filter(r=>r.function_name===fn).map(r=> new Date(r.day).toLocaleDateString());

  return (
    <Box sx={{ p: 3, position: 'relative' }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate('/admin-panel')} color="primary"><ArrowBack /></IconButton>
        <QueryStats color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Métricas Edge Functions</Typography>
        <Chip label={range.label} color="primary" size="small" />
        <Box flexGrow={1} />
        <ToggleButtonGroup size="small" exclusive value={range.label} onChange={handleRange}>
          {RANGE_OPTIONS.map(o => <ToggleButton key={o.label} value={o.label}>{o.label}</ToggleButton>)}
        </ToggleButtonGroup>
        <Tooltip title="Refrescar"><IconButton onClick={fetchData} disabled={loading}><Refresh /></IconButton></Tooltip>
      </Stack>
      {loading && <LinearProgress sx={{ mb:2 }} />}
      {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}

      <Paper elevation={3} sx={{ borderRadius: 3, p: 2, backdropFilter:'blur(6px)', background: theme=> theme.palette.mode==='dark' ? 'rgba(30,30,30,0.7)' : 'rgba(255,255,255,0.9)', minHeight: 360 }}>
        {!loading && !error && fnDaily.length===0 && (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }} spacing={2}>
            <Typography variant="h6" color="text.secondary">Sin datos de métricas todavía</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth:480, textAlign:'center' }}>
              Instrumenta las Edge Functions (se insertan filas en <code>edge_function_invocations</code>) o espera a que se acumulen invocaciones.
            </Typography>
          </Stack>
        )}
        <Tabs value={tab} onChange={handleTabChange} variant="scrollable" scrollButtons allowScrollButtonsMobile>
          <Tab icon={<Timeline />} iconPosition="start" label="Overview" {...a11yProps(0)} />
          <Tab icon={<Speed />} iconPosition="start" label="Latencias" {...a11yProps(1)} />
          <Tab icon={<ErrorOutline />} iconPosition="start" label="Errores" {...a11yProps(2)} />
          <Tab icon={<Insights />} iconPosition="start" label="Funciones" {...a11yProps(3)} />
        </Tabs>
        <Divider sx={{ mb: 2 }} />

        <TabPanel index={0}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight:500 }}>Resumen Global ({functions.length} funciones)</Typography>
          <Box sx={{ display:'flex', flexWrap:'wrap', gap:3 }}>
            <StatCard title="Invocaciones" value={fnDaily.reduce((a,b)=>a+b.invocations,0)} />
            <StatCard title="Errores" value={fnDaily.reduce((a,b)=>a+b.errors,0)} color={palette.error} />
            <StatCard title="Error Rate Global %" value={(() => {const inv=fnDaily.reduce((a,b)=>a+b.invocations,0); const err=fnDaily.reduce((a,b)=>a+b.errors,0); return inv? (err*100/inv).toFixed(2):'0.00';})()} />
            <StatCard title="Avg Dur (ms)" value={(() => {const arr=fnDaily.filter(r=>r.avg_duration_ms!=null); if(!arr.length)return '—'; return (arr.reduce((a,b)=>a+b.avg_duration_ms,0)/arr.length).toFixed(1);})()} />
            <StatCard title="p95 (ms)" value={(() => {const arr=fnDaily.filter(r=>r.p95_duration_ms!=null); if(!arr.length)return '—'; return (arr.reduce((a,b)=>a+b.p95_duration_ms,0)/arr.length).toFixed(0);})()} />
            <StatCard title="SLA Breach %" value={(() => {const arr=fnDaily.filter(r=>r.sla_breach_pct!=null); if(!arr.length)return '0.00'; return (arr.reduce((a,b)=>a+b.sla_breach_pct,0)/arr.length).toFixed(2);})()} />
          </Box>
          <Box sx={{ mt:4 }}>
            <Typography variant="subtitle2" sx={{ mb:1, fontWeight:600 }}>Distribución de Invocaciones por Función</Typography>
            <BarChart height={320} series={[{ data: functions.map(f=> totals[f]?.inv||0), label:'Invocaciones', color: palette.primary }]} xAxis={[{ data: functions, scaleType:'band' }]} grid={{ horizontal: true }} />
          </Box>
        </TabPanel>

        <TabPanel index={1}>
          <Typography variant="subtitle1" sx={{ mb:2, fontWeight:500 }}>Latencias (Avg vs p95) por Día</Typography>
          {functions.map(fn => (
            <Paper key={fn} variant="outlined" sx={{ mb:3, p:2 }}>
              <Typography variant="subtitle2" sx={{ mb:1, fontWeight:600 }}>{fn}</Typography>
              <LineChart height={240} series={lineSeries(fn)} xAxis={[{ data: lineX(fn) }]} />
            </Paper>
          ))}
        </TabPanel>

        <TabPanel index={2}>
          <Typography variant="subtitle1" sx={{ mb:2, fontWeight:500 }}>Errores Totales por Función</Typography>
            <BarChart height={350} series={[{ data: functions.map(f=> totals[f]?.err||0), label:'Errores', color: palette.error }]} xAxis={[{ data: functions, scaleType:'band' }]} grid={{ horizontal:true }} />
            <Box sx={{ mt:4 }}>
              <Typography variant="subtitle2" sx={{ mb:1 }}>Tasa de Error (%)</Typography>
              <BarChart height={320} series={[{ data: functions.map(f=> { const t=totals[f]; return t && t.inv? +( (t.err*100)/t.inv ).toFixed(2):0; }), label:'Error %', color: palette.warning }]} xAxis={[{ data: functions, scaleType:'band' }]} />
            </Box>
        </TabPanel>

  <TabPanel index={3}>
          <Typography variant="subtitle1" sx={{ mb:2, fontWeight:500 }}>Detalle por Función</Typography>
          <Stack spacing={3}>
            {functions.map(fn => {
              const agg = totals[fn];
              const errorPct = agg?.inv ? (agg.err*100/agg.inv).toFixed(2) : '0.00';
              const lastRow = fnDaily.filter(r=>r.function_name===fn).slice(-1)[0] || {};
              const p95 = lastRow.p95_duration_ms != null ? lastRow.p95_duration_ms : '—';
              const sla = lastRow.sla_ms != null ? lastRow.sla_ms : '—';
              const breachPct = lastRow.sla_breach_pct != null ? lastRow.sla_breach_pct : null;
              return (
                <Paper key={fn} variant="outlined" sx={{ p:2, borderLeft: theme => `4px solid ${palette.primary}` }}>
                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <Typography variant="h6" sx={{ flexGrow:1 }}>{fn}</Typography>
                    <Chip label={`Inv: ${agg?.inv||0}`} color="primary" size="small" />
                    <Chip label={`Err: ${agg?.err||0}`} color={agg?.err? 'error':'success'} size="small" />
                    <Tooltip title="Porcentaje de invocaciones con error"><Chip label={`Err %: ${errorPct}`} color={Number(errorPct)>2 ? 'warning':'success'} size="small" /></Tooltip>
                    <Tooltip title="Latencia p95 (el 95% de invocaciones es más rápido o igual)"><Chip label={`p95: ${p95}`} color="info" size="small" /></Tooltip>
                    {sla !== '—' && <Tooltip title="Objetivo SLA (ms)"><Chip label={`SLA: ${sla}`} color="default" size="small" /></Tooltip>}
                    {breachPct != null && <Tooltip title="Porcentaje de invocaciones que superaron el SLA"><Chip label={`SLA%: ${breachPct}`} color={breachPct>1? 'warning':'success'} size="small" /></Tooltip>}
                  </Stack>
                  <Box sx={{ mt:2 }}>
                    <LineChart height={200} series={lineSeries(fn)} xAxis={[{ data: lineX(fn) }]} />
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        </TabPanel>
      </Paper>
    </Box>
  );
};

const StatCard = ({ title, value, color }) => (
  <Paper elevation={2} sx={{ p:2, minWidth:170, borderRadius:2, background: theme => theme.palette.mode==='dark' ? 'linear-gradient(135deg,#1e1e1e,#2a2a2a)' : 'linear-gradient(135deg,#ffffff,#f5f7fa)', position:'relative', overflow:'hidden' }}>
    <Typography variant="caption" sx={{ fontWeight:600, letterSpacing:.5, textTransform:'uppercase', color:'text.secondary' }}>{title}</Typography>
    <Typography variant="h5" sx={{ fontWeight:700, mt: .5, color: color||'text.primary' }}>{value}</Typography>
    <Box sx={{ position:'absolute', inset:0, background: color? `${color}08`:'#1976d208', pointerEvents:'none' }} />
  </Paper>
);

export default AdminMetrics;
