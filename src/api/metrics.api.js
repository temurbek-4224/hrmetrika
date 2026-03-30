/**
 * HR Metrika — Metrics API
 *
 * Seven thin fetch functions, one per dashboard analytics endpoint.
 * All endpoints are protected by JWT auth (handled by api client).
 */
import api from './client'

export const getMetricsOverview   = () => api.get('/metrics/overview')
export const getMetricsHeadcount  = () => api.get('/metrics/headcount')
export const getMetricsAbsence    = () => api.get('/metrics/absence')
export const getMetricsSalary     = () => api.get('/metrics/salary')
export const getMetricsHiring     = () => api.get('/metrics/hiring')
export const getMetricsTurnover   = () => api.get('/metrics/turnover')
export const getMetricsFinancials = () => api.get('/metrics/financials')
