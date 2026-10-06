import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiBase = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

  get<T>(path: string): Observable<T> {
    const url = path.startsWith('/') ? `${this.apiBase}${path}` : `${this.apiBase}/${path}`;
    return this.http.get<T>(url);
  }

  post<T>(path: string, body: any): Observable<T> {
    const url = path.startsWith('/') ? `${this.apiBase}${path}` : `${this.apiBase}/${path}`;
    return this.http.post<T>(url, body);
  }

  put<T>(path: string, body: any): Observable<T> {
    const url = path.startsWith('/') ? `${this.apiBase}${path}` : `${this.apiBase}/${path}`;
    return this.http.put<T>(url, body);
  }

  delete<T>(path: string): Observable<T> {
    const url = path.startsWith('/') ? `${this.apiBase}${path}` : `${this.apiBase}/${path}`;
    return this.http.delete<T>(url);
  }

  fetchModuleData(moduleKey: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/data/${moduleKey}`);
  }

  fetchDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/dashboard/stats`);
  }

  fetchRequerimientos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/compras/requerimientos`);
  }

  createRequerimiento(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/compras/requerimientos`, data);
  }

  updateEtapaRequerimiento(id: number, etapa: string): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/compras/requerimientos/${id}/etapa`, { etapa_negocio: etapa });
  }

  fetchRequerimiento(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/compras/requerimientos/${id}`);
  }

  updateRequerimiento(id: string | number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/compras/requerimientos/${id}`, data);
  }

  fetchViaticos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/tesoreria/viaticos`);
  }

  createViatico(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/tesoreria/viaticos`, data);
  }

  updateEtapaViatico(id: number, etapa: string): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/tesoreria/viaticos/${id}/etapa`, { etapa });
  }

  fetchGastos(viaticoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/tesoreria/viaticos/${viaticoId}/gastos`);
  }

  addGasto(viaticoId: number, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/tesoreria/viaticos/${viaticoId}/gastos`, formData);
  }

  getArchivoUrl(gastoId: number): string {
    return `${this.apiBase}/rendicion/archivo/${gastoId}`;
  }

  fetchProveedores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/proveedores`);
  }

  createProveedor(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/proveedores`, data);
  }

  createSolicitudProveedor(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/solicitudes-proveedor`, data);
  }

  invitarProveedor(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/portal/invitar-proveedor`, data);
  }

  aprobarExpedienteProveedor(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/portal/aprobar-expediente`, data);
  }

  updateModuleData(module: string, id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/data/${module}/${id}`, data);
  }

  createComite(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/comite/lista`, data);
  }

  fetchProveedor(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/proveedores/${id}`);
  }

  fetchSolicitudProveedor(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/solicitudes-proveedor/${id}`);
  }

  updateProveedor(id: string | number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/proveedores/${id}`, data);
  }

  updateSolicitudProveedor(id: string | number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/solicitudes-proveedor/${id}`, data);
  }

  // --- Órdenes de Compra ---
  fetchOrdenCompra(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/compras/ordenes/${id}`);
  }

  fetchOrdenCompraByCodigo(codigo: string): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/compras/ordenes/by-codigo/${codigo}`);
  }

  updateOrdenCompra(id: string | number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/compras/ordenes/${id}`, data);
  }

  addOrdenCompraItem(ocId: string | number, item: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/compras/ordenes/${ocId}/items`, item);
  }

  deleteOrdenCompraItem(itemId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/compras/ordenes/items/${itemId}`);
  }

  // --- Recepciones de Almacén ---
  fetchRecepcion(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/compras/recepciones/${id}`);
  }

  updateRecepcion(id: string | number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/compras/recepciones/${id}`, data);
  }

  addRecepcionItem(recId: string | number, item: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/compras/recepciones/${recId}/items`, item);
  }

  deleteRecepcionItem(itemId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/compras/recepciones/items/${itemId}`);
  }

  aprobarRecepcionCxP(id: string | number): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/compras/recepciones/${id}/aprobar-cxp`, {});
  }

  // --- CxP y Pagos ---
  fetchCxp(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/tesoreria/cxp/${id}`);
  }

  updateCxp(id: string | number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/tesoreria/cxp/${id}`, data);
  }

  devolverCxp(id: string | number, motivo: string): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/tesoreria/cxp/${id}/devolver`, { motivo_devolucion: motivo });
  }

  pagarCxp(id: string | number, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/tesoreria/cxp/${id}/pagar`, data);
  }

  fetchPago(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/tesoreria/pagos/${id}`);
  }
}
