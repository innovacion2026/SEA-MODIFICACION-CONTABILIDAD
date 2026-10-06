import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from '../../services/api.service';

interface ComprobanteLinea {
  id?: number;
  linea_nro: number;
  cuenta_contable: string;
  descripcion_cuenta: string;
  tipo_movimiento: 'DEBE' | 'HABER';
  monto: number;
  centro_costo?: string;
  auxiliar_rif?: string;
}

interface Comprobante {
  id: number;
  codigo_comprobante: string;
  codigo?: string;
  modulo_origen: string;
  modulo?: string;
  referencia_origen_id?: number;
  nro_documento_origen?: string;
  fecha_comprobante?: string;
  concepto: string;
  total_debe: number;
  total_haber: number;
  estatus_envio: 'PENDIENTE' | 'PROCESADO' | 'ERROR';
  fecha_envio?: string;
  contabilidad_nro_asiento?: string;
  mensaje_respuesta?: string;
  lineas?: ComprobanteLinea[];
}

interface MapeoCuenta {
  id?: number;
  modulo_origen: string;
  modulo?: string;
  concepto_operacion: string;
  concepto?: string;
  codigo_partida_sea?: string;
  cuenta_contable: string;
  nombre_cuenta: string;
  centro_costo?: string;
  estatus: string;
}

interface TransmisionLog {
  id: number;
  comprobante_id: number;
  codigo_comprobante?: string;
  modulo_origen?: string;
  fecha_intento: string;
  tipo_transmision: string;
  estado_resultado: string;
  codigo_respuesta?: string;
  detalle_respuesta?: string;
}

@Component({
  selector: 'app-contabilidad-interfaz',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="w-full max-w-full space-y-6 pb-12">
      <!-- Header Bar (Full Width) -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-sm w-full">
        <div class="flex items-center gap-4">
          <div class="p-3.5 bg-primary/10 text-primary rounded-2xl shadow-inner">
            <lucide-icon name="arrow-left-right" class="w-7 h-7"></lucide-icon>
          </div>
          <div>
            <h1 class="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Interfaz Contable Central</h1>
            <p class="text-sm text-slate-500 font-medium">Módulo emisor y consolidador de comprobantes contables hacia la Contabilidad Central</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button (click)="resetDemoData()" class="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95" title="Cargar y reiniciar datos de prueba limpios">
            <lucide-icon name="database" class="w-4 h-4 text-primary"></lucide-icon> Cargar Datos de Prueba
          </button>
          <button (click)="loadAllData()" class="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95">
            <lucide-icon name="rotate-cw" class="w-4 h-4"></lucide-icon> Actualizar Datos
          </button>
          <button (click)="transmitirLote()" [disabled]="loading || countPendientes === 0" class="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-primary/25 transition-all active:scale-95 disabled:opacity-50">
            <lucide-icon name="send" class="w-4.5 h-4.5"></lucide-icon> Transmitir Lote Pendiente ({{ countPendientes }})
          </button>
        </div>
      </div>

      <!-- Metric Cards KPI (Full Width 4 Columns) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Comprobantes</span>
            <div class="text-2xl font-black text-slate-800 mt-1">{{ comprobantes.length }}</div>
          </div>
          <div class="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <lucide-icon name="file-spreadsheet" class="w-5 h-5"></lucide-icon>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-bold text-amber-500 uppercase tracking-wider">Pendientes por Envío</span>
            <div class="text-2xl font-black text-amber-600 mt-1">{{ countPendientes }}</div>
          </div>
          <div class="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <lucide-icon name="clock" class="w-5 h-5"></lucide-icon>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-bold text-emerald-500 uppercase tracking-wider">Procesados en Central</span>
            <div class="text-2xl font-black text-emerald-600 mt-1">{{ countProcesados }}</div>
          </div>
          <div class="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <lucide-icon name="check-circle-2" class="w-5 h-5"></lucide-icon>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-bold text-rose-500 uppercase tracking-wider">Con Errores / Reintento</span>
            <div class="text-2xl font-black text-rose-600 mt-1">{{ countErrores }}</div>
          </div>
          <div class="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <lucide-icon name="alert-triangle" class="w-5 h-5"></lucide-icon>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex border-b border-slate-200 gap-2 w-full">
        <button (click)="activeTab = 'asientos'" [class.border-primary]="activeTab === 'asientos'" [class.text-primary]="activeTab === 'asientos'" class="py-3.5 px-6 text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-all">
          <lucide-icon name="file-spreadsheet" class="w-4.5 h-4.5"></lucide-icon> Asientos Generados ({{ comprobantes.length }})
        </button>
        <button (click)="activeTab = 'mapeo'" [class.border-primary]="activeTab === 'mapeo'" [class.text-primary]="activeTab === 'mapeo'" class="py-3.5 px-6 text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-all">
          <lucide-icon name="settings-2" class="w-4.5 h-4.5"></lucide-icon> Mapeo de Cuentas ({{ mapeos.length }})
        </button>
        <button (click)="activeTab = 'logs'" [class.border-primary]="activeTab === 'logs'" [class.text-primary]="activeTab === 'logs'" class="py-3.5 px-6 text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-all">
          <lucide-icon name="scroll-text" class="w-4.5 h-4.5"></lucide-icon> Log de Transmisión ({{ logs.length }})
        </button>
      </div>

      <!-- Notification Alert -->
      <div *ngIf="message" class="p-4 rounded-xl text-sm font-bold flex items-center justify-between shadow-sm transition-all w-full"
           [ngClass]="messageType === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'">
        <div class="flex items-center gap-2">
          <lucide-icon [name]="messageType === 'success' ? 'check-circle-2' : 'alert-circle'" class="w-5 h-5"></lucide-icon>
          <span>{{ message }}</span>
        </div>
        <button (click)="message = ''" class="text-slate-400 hover:text-slate-600 font-black">✕</button>
      </div>

      <!-- Loading Spinner Indicator -->
      <div *ngIf="loading" class="p-4 rounded-xl bg-primary/5 border border-primary/20 text-primary font-bold text-sm flex items-center justify-center gap-3 animate-pulse">
        <lucide-icon name="rotate-cw" class="w-5 h-5 animate-spin"></lucide-icon>
        <span>Transmitiendo datos y sincronizando con la Contabilidad Central...</span>
      </div>

      <!-- TAB 1: ASIENTOS GENERADOS (Full Screen Width Table) -->
      <div *ngIf="activeTab === 'asientos'" class="space-y-4 w-full">
        <!-- Filter Bar -->
        <div class="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm w-full">
          <div class="relative w-full md:w-1/3">
            <lucide-icon name="search" class="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400"></lucide-icon>
            <input type="text" [(ngModel)]="searchFilter" placeholder="Buscar por código, concepto, documento..." class="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary">
          </div>
          <div class="flex items-center gap-4 w-full md:w-auto">
            <div class="flex items-center gap-2">
              <label class="text-xs font-bold text-slate-500 uppercase">Estado:</label>
              <select [(ngModel)]="statusFilter" class="px-3.5 py-2 text-sm font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-primary">
                <option value="ALL">Todos los estados</option>
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="PROCESADO">PROCESADO</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Full Width Table -->
        <div class="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm w-full">
          <div class="overflow-x-auto w-full">
            <table class="w-full text-left text-sm text-slate-600 min-w-full">
              <thead class="bg-slate-50 text-slate-700 font-extrabold text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th class="p-4">Código Asiento</th>
                  <th class="p-4">Módulo Origen</th>
                  <th class="p-4">Concepto Operativo</th>
                  <th class="p-4">Doc. Referencia</th>
                  <th class="p-4 text-right">Total Debe</th>
                  <th class="p-4 text-right">Total Haber</th>
                  <th class="p-4">Estado Envío</th>
                  <th class="p-4">N° Asiento Central</th>
                  <th class="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let item of filteredComprobantes" class="hover:bg-slate-50/80 transition-all">
                  <td class="p-4 font-black text-slate-900 font-mono">{{ item.codigo_comprobante || item.codigo || '-' }}</td>
                  <td class="p-4">
                    <span class="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-slate-100 text-slate-700">{{ item.modulo_origen || item.modulo || '-' }}</span>
                  </td>
                  <td class="p-4 font-medium text-slate-800 max-w-md">
                    <div>{{ item.concepto || '-' }}</div>
                    <div *ngIf="item.mensaje_respuesta && item.estatus_envio === 'ERROR'" class="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <lucide-icon name="alert-circle" class="w-3.5 h-3.5"></lucide-icon> {{ item.mensaje_respuesta }}
                    </div>
                  </td>
                  <td class="p-4 font-mono text-slate-500">{{ item.nro_documento_origen || '-' }}</td>
                  <td class="p-4 text-right font-mono font-bold text-slate-900">{{ (item.total_debe || 0) | currency:'USD':'symbol':'1.2-2' }}</td>
                  <td class="p-4 text-right font-mono font-bold text-slate-900">{{ (item.total_haber || 0) | currency:'USD':'symbol':'1.2-2' }}</td>
                  <td class="p-4">
                    <span [ngClass]="{
                      'bg-amber-100 text-amber-900': item.estatus_envio === 'PENDIENTE',
                      'bg-emerald-100 text-emerald-900': item.estatus_envio === 'PROCESADO',
                      'bg-rose-100 text-rose-900': item.estatus_envio === 'ERROR'
                    }" class="px-3 py-1 text-xs font-extrabold rounded-full inline-flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full" [ngClass]="{
                        'bg-amber-500': item.estatus_envio === 'PENDIENTE',
                        'bg-emerald-500': item.estatus_envio === 'PROCESADO',
                        'bg-rose-500': item.estatus_envio === 'ERROR'
                      }"></span>
                      {{ item.estatus_envio || 'PENDIENTE' }}
                    </span>
                  </td>
                  <td class="p-4 font-mono text-xs font-extrabold" [ngClass]="item.contabilidad_nro_asiento ? 'text-primary' : 'text-slate-400'">
                    {{ item.contabilidad_nro_asiento || 'Sin procesar' }}
                  </td>
                  <td class="p-4">
                    <div class="flex items-center justify-center gap-2">
                      <button (click)="openDetail(item)" class="p-2 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all" title="Ver Detalle Asiento">
                        <lucide-icon name="eye" class="w-4.5 h-4.5"></lucide-icon>
                      </button>
                      <button *ngIf="item.estatus_envio === 'PENDIENTE'" (click)="transmitirComprobante(item)" class="px-3 py-1.5 bg-primary text-white font-extrabold text-xs rounded-xl shadow-sm hover:bg-primary/95 transition-all flex items-center gap-1">
                        <lucide-icon name="send" class="w-3.5 h-3.5"></lucide-icon> Transmitir
                      </button>
                      <button *ngIf="item.estatus_envio === 'ERROR'" (click)="transmitirComprobante(item)" class="px-3 py-1.5 bg-rose-600 text-white font-extrabold text-xs rounded-xl shadow-sm hover:bg-rose-700 transition-all flex items-center gap-1">
                        <lucide-icon name="rotate-cw" class="w-3.5 h-3.5"></lucide-icon> Reintentar
                      </button>
                      <span *ngIf="item.estatus_envio === 'PROCESADO'" class="text-xs font-extrabold text-emerald-600 flex items-center gap-1">
                        <lucide-icon name="check-circle-2" class="w-4 h-4"></lucide-icon> Enviado
                      </span>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="filteredComprobantes.length === 0">
                  <td colspan="9" class="p-12 text-center text-slate-400 font-medium">No se encontraron comprobantes con los criterios seleccionados.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: MAPEO DE CUENTAS (Full Width Table) -->
      <div *ngIf="activeTab === 'mapeo'" class="space-y-4 w-full">
        <div class="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm w-full">
          <div>
            <h3 class="font-extrabold text-slate-800 text-base">Reglas de Mapeo entre SEA y Cuentas Contables Centrales</h3>
            <p class="text-xs text-slate-500 font-medium">Asocia cada concepto operativo de SEA con el código de cuenta del catálogo general</p>
          </div>
          <button (click)="openMapeoModal()" class="px-4 py-2.5 bg-primary text-white font-extrabold text-xs rounded-xl hover:bg-primary/95 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20">
            <lucide-icon name="plus" class="w-4 h-4"></lucide-icon> Nuevo Mapeo
          </button>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm w-full">
          <div class="overflow-x-auto w-full">
            <table class="w-full text-left text-sm text-slate-600 min-w-full">
              <thead class="bg-slate-50 text-slate-700 font-extrabold text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th class="p-4">Módulo Origen</th>
                  <th class="p-4">Concepto Operativo SEA</th>
                  <th class="p-4">Partida SEA</th>
                  <th class="p-4">Código Cuenta Central</th>
                  <th class="p-4">Nombre Cuenta Contable</th>
                  <th class="p-4">Centro Costo</th>
                  <th class="p-4">Estatus</th>
                  <th class="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let m of mapeos" class="hover:bg-slate-50/80 transition-all">
                  <td class="p-4 font-black text-slate-900">{{ m.modulo_origen || m.modulo || 'CXP' }}</td>
                  <td class="p-4 font-medium text-slate-800">{{ m.concepto_operacion || m.concepto || '-' }}</td>
                  <td class="p-4 font-mono text-xs text-slate-500">{{ m.codigo_partida_sea || 'N/A' }}</td>
                  <td class="p-4 font-mono font-extrabold text-primary text-base">{{ m.cuenta_contable || '-' }}</td>
                  <td class="p-4 font-bold text-slate-900">{{ m.nombre_cuenta || '-' }}</td>
                  <td class="p-4 text-slate-500 font-medium">{{ m.centro_costo || '-' }}</td>
                  <td class="p-4">
                    <span class="px-2.5 py-1 text-xs font-extrabold rounded-full bg-emerald-100 text-emerald-800">{{ m.estatus || 'Activo' }}</span>
                  </td>
                  <td class="p-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <button (click)="openMapeoModal(m)" class="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all" title="Editar Mapeo">
                        <lucide-icon name="pencil" class="w-4 h-4"></lucide-icon>
                      </button>
                      <button (click)="deleteMapeo(m.id)" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Eliminar Mapeo">
                        <lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 3: LOGS DE TRANSMISIÓN (Full Width Table) -->
      <div *ngIf="activeTab === 'logs'" class="space-y-4 w-full">
        <div class="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm w-full">
          <div class="overflow-x-auto w-full">
            <table class="w-full text-left text-sm text-slate-600 min-w-full">
              <thead class="bg-slate-50 text-slate-700 font-extrabold text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th class="p-4">ID Log</th>
                  <th class="p-4">Código Comprobante</th>
                  <th class="p-4">Fecha Intento</th>
                  <th class="p-4">Tipo Transmisión</th>
                  <th class="p-4">Resultado</th>
                  <th class="p-4">Código Resp.</th>
                  <th class="p-4">Detalle Respuesta</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let log of logs" class="hover:bg-slate-50/80 transition-all">
                  <td class="p-4 font-mono text-xs text-slate-400">#{{ log.id }}</td>
                  <td class="p-4 font-black text-slate-900 font-mono">{{ log.codigo_comprobante || ('#' + log.comprobante_id) }}</td>
                  <td class="p-4 text-xs text-slate-500 font-medium">{{ log.fecha_intento | date:'medium' }}</td>
                  <td class="p-4"><span class="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700">{{ log.tipo_transmision }}</span></td>
                  <td class="p-4">
                    <span [ngClass]="log.estado_resultado === 'OK' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'" class="px-3 py-1 text-xs font-extrabold rounded-full">
                      {{ log.estado_resultado }}
                    </span>
                  </td>
                  <td class="p-4 font-mono text-xs font-bold">{{ log.codigo_respuesta || '200' }}</td>
                  <td class="p-4 text-xs font-medium text-slate-700">{{ log.detalle_respuesta }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- MODAL DETALLE ASIENTO CONTABLE -->
      <div *ngIf="selectedComprobante" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
          <div class="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-primary uppercase tracking-wider">Detalle de Comprobante Contable</span>
              <h2 class="text-2xl font-black text-slate-900 font-mono">{{ selectedComprobante.codigo_comprobante }}</h2>
            </div>
            <button (click)="selectedComprobante = null" class="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/50 transition-all font-bold">✕</button>
          </div>

          <div class="p-6 space-y-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl text-xs border border-slate-200/60">
              <div>
                <span class="text-slate-400 block font-bold uppercase">Módulo Origen</span>
                <span class="font-extrabold text-slate-800 text-sm">{{ selectedComprobante.modulo_origen }}</span>
              </div>
              <div>
                <span class="text-slate-400 block font-bold uppercase">Documento Referencia</span>
                <span class="font-extrabold text-slate-800 text-sm font-mono">{{ selectedComprobante.nro_documento_origen || 'N/A' }}</span>
              </div>
              <div>
                <span class="text-slate-400 block font-bold uppercase">Fecha Emisión</span>
                <span class="font-extrabold text-slate-800 text-sm">{{ selectedComprobante.fecha_comprobante | date:'shortDate' }}</span>
              </div>
              <div>
                <span class="text-slate-400 block font-bold uppercase">N° Asiento Central</span>
                <span class="font-extrabold text-primary text-sm font-mono">{{ selectedComprobante.contabilidad_nro_asiento || 'Sin procesar' }}</span>
              </div>
            </div>

            <div>
              <span class="text-xs font-extrabold text-slate-400 uppercase block mb-1">Concepto Operativo</span>
              <p class="text-sm font-semibold text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">{{ selectedComprobante.concepto }}</p>
            </div>

            <!-- Error Banner in Modal if Error Status -->
            <div *ngIf="selectedComprobante.estatus_envio === 'ERROR'" class="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
              <div class="flex items-center gap-2 text-rose-700 font-extrabold text-sm">
                <lucide-icon name="alert-triangle" class="w-5 h-5 text-rose-600"></lucide-icon>
                <span>Fallo de Transmisión Registrado en la Contabilidad Central</span>
              </div>
              <p class="text-xs font-bold text-rose-900 leading-relaxed bg-white/70 p-3 rounded-xl border border-rose-200/60 font-mono">
                {{ selectedComprobante.mensaje_respuesta || 'Error al procesar el comprobante' }}
              </p>
              <div class="text-xs text-rose-800 font-medium leading-relaxed">
                💡 <strong>¿Cómo proceder con este envío fallido?</strong><br>
                • <strong>Si el período contable fue cerrado:</strong> Modifique la fecha del asiento al período abierto actual o solicite la reapertura temporal del período en la Contabilidad Central.<br>
                • <strong>Si la cuenta contable o centro de costo es inválido:</strong> Vaya a la pestaña <strong>"Mapeo de Cuentas"</strong>, actualice la regla con el código de cuenta activo del catálogo general, y presione <strong>"Reintentar Transmisión"</strong>.
              </div>
            </div>

            <!-- Detail Lines (Debe / Haber Table) -->
            <div>
              <h4 class="font-extrabold text-slate-800 text-sm mb-3">Líneas del Asiento Contable (Debe / Haber)</h4>
              <table class="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead class="bg-slate-100 font-extrabold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th class="p-3">N°</th>
                    <th class="p-3">Cuenta Contable</th>
                    <th class="p-3">Descripción Cuenta</th>
                    <th class="p-3 text-center">Tipo</th>
                    <th class="p-3 text-right">Debe</th>
                    <th class="p-3 text-right">Haber</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr *ngFor="let linea of selectedComprobante.lineas" class="hover:bg-slate-50">
                    <td class="p-3 font-mono text-slate-400">{{ linea.linea_nro }}</td>
                    <td class="p-3 font-mono font-extrabold text-primary text-sm">{{ linea.cuenta_contable }}</td>
                    <td class="p-3 font-bold text-slate-800">{{ linea.descripcion_cuenta }}</td>
                    <td class="p-3 text-center">
                      <span [ngClass]="linea.tipo_movimiento === 'DEBE' ? 'bg-blue-100 text-blue-900' : 'bg-purple-100 text-purple-900'" class="px-2.5 py-1 font-extrabold rounded-md text-xs">
                        {{ linea.tipo_movimiento }}
                      </span>
                    </td>
                    <td class="p-3 text-right font-mono font-bold text-slate-900">
                      {{ linea.tipo_movimiento === 'DEBE' ? (linea.monto | currency:'USD':'symbol':'1.2-2') : '-' }}
                    </td>
                    <td class="p-3 text-right font-mono font-bold text-slate-900">
                      {{ linea.tipo_movimiento === 'HABER' ? (linea.monto | currency:'USD':'symbol':'1.2-2') : '-' }}
                    </td>
                  </tr>
                </tbody>
                <tfoot class="bg-slate-50 font-black text-slate-900 border-t border-slate-200 text-sm">
                  <tr>
                    <td colspan="4" class="p-3 text-right">TOTALES:</td>
                    <td class="p-3 text-right font-mono text-blue-700">{{ selectedComprobante.total_debe | currency:'USD':'symbol':'1.2-2' }}</td>
                    <td class="p-3 text-right font-mono text-purple-700">{{ selectedComprobante.total_haber | currency:'USD':'symbol':'1.2-2' }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div class="p-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button (click)="selectedComprobante = null" class="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all">Cerrar</button>
            <button *ngIf="selectedComprobante.estatus_envio === 'ERROR'" (click)="transmitirComprobante(selectedComprobante)" class="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-rose-600/20 flex items-center gap-2">
              <lucide-icon name="rotate-cw" class="w-4 h-4"></lucide-icon> Reintentar Transmisión
            </button>
            <button *ngIf="selectedComprobante.estatus_envio === 'PENDIENTE'" (click)="transmitirComprobante(selectedComprobante)" class="px-6 py-2.5 bg-primary hover:bg-primary/95 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-primary/20 flex items-center gap-2">
              <lucide-icon name="send" class="w-4 h-4"></lucide-icon> Transmitir a Contabilidad Central
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL NUEVO / EDITAR MAPEO -->
      <div *ngIf="showMapeoModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
          <div class="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 class="font-extrabold text-slate-900 text-base">{{ mapeoForm.id ? 'Editar Regla de Mapeo' : 'Nueva Regla de Mapeo Contable' }}</h3>
            <button (click)="showMapeoModal = false" class="text-slate-400 hover:text-slate-600 font-bold">✕</button>
          </div>

          <div class="p-6 space-y-4 text-sm">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Módulo Origen SEA</label>
              <select [(ngModel)]="mapeoForm.modulo_origen" class="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-primary font-semibold">
                <option value="CXP">CXP (Cuentas por Pagar)</option>
                <option value="PAGOS">PAGOS (Tesorería)</option>
                <option value="VIATICOS">VIATICOS</option>
                <option value="CAJA_CHICA">CAJA_CHICA</option>
                <option value="RETENCIONES">RETENCIONES</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Concepto Operativo SEA</label>
              <input type="text" [(ngModel)]="mapeoForm.concepto_operacion" placeholder="Ej: Factura Proveedor / Servicio" class="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-primary font-medium">
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Código Cuenta Contable Central</label>
              <input type="text" [(ngModel)]="mapeoForm.cuenta_contable" placeholder="Ej: 510201001" class="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none focus:border-primary">
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Nombre de la Cuenta Contable</label>
              <input type="text" [(ngModel)]="mapeoForm.nombre_cuenta" placeholder="Ej: Gastos de Mantenimiento" class="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-primary font-medium">
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Partida SEA (Opcional)</label>
                <input type="text" [(ngModel)]="mapeoForm.codigo_partida_sea" placeholder="PART-401.01.02" class="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-primary">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Centro Costo (Opcional)</label>
                <input type="text" [(ngModel)]="mapeoForm.centro_costo" placeholder="CC-IT01" class="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-primary">
              </div>
            </div>
          </div>

          <div class="p-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button (click)="showMapeoModal = false" class="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-300 transition-all">Cancelar</button>
            <button (click)="saveMapeo()" class="px-5 py-2 bg-primary text-white font-extrabold text-xs rounded-xl hover:bg-primary/95 transition-all shadow-md shadow-primary/20">Guardar Mapeo</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ContabilidadInterfazComponent implements OnInit {
  activeTab: 'asientos' | 'mapeo' | 'logs' = 'asientos';
  loading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  comprobantes: Comprobante[] = [];
  mapeos: MapeoCuenta[] = [];
  logs: TransmisionLog[] = [];

  searchFilter = '';
  statusFilter = 'ALL';

  selectedComprobante: Comprobante | null = null;
  showMapeoModal = false;

  mapeoForm: MapeoCuenta = {
    modulo_origen: 'CXP',
    concepto_operacion: '',
    cuenta_contable: '',
    nombre_cuenta: '',
    estatus: 'Activo'
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.loading = true;
    this.apiService.get<Comprobante[]>('/contabilidad/comprobantes').subscribe({
      next: (res: Comprobante[]) => {
        this.comprobantes = res || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    this.apiService.get<MapeoCuenta[]>('/contabilidad/mapeos').subscribe({
      next: (res: MapeoCuenta[]) => {
        this.mapeos = res || [];
      }
    });

    this.apiService.get<TransmisionLog[]>('/contabilidad/logs').subscribe({
      next: (res: TransmisionLog[]) => {
        this.logs = res || [];
      }
    });
  }

  resetDemoData() {
    this.loading = true;
    this.apiService.post<any>('/contabilidad/reset-demo', {}).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.showMessage('success', res.message || 'Datos de prueba restablecidos exitosamente');
        this.loadAllData();
      },
      error: (err: any) => {
        this.loading = false;
        this.showMessage('error', 'Error al restablecer datos de prueba: ' + (err.error?.error || err.message));
      }
    });
  }

  get countPendientes(): number {
    return this.comprobantes.filter(c => c.estatus_envio === 'PENDIENTE').length;
  }

  get countProcesados(): number {
    return this.comprobantes.filter(c => c.estatus_envio === 'PROCESADO').length;
  }

  get countErrores(): number {
    return this.comprobantes.filter(c => c.estatus_envio === 'ERROR').length;
  }

  get filteredComprobantes(): Comprobante[] {
    return this.comprobantes.filter(item => {
      const matchesStatus = this.statusFilter === 'ALL' || item.estatus_envio === this.statusFilter;
      const q = this.searchFilter.toLowerCase();
      const matchesSearch = !q ||
        item.codigo_comprobante.toLowerCase().includes(q) ||
        item.concepto.toLowerCase().includes(q) ||
        (item.nro_documento_origen && item.nro_documento_origen.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }

  openDetail(comp: Comprobante) {
    this.selectedComprobante = comp;
  }

  transmitirComprobante(comp: Comprobante) {
    this.loading = true;
    this.apiService.post<any>(`/contabilidad/transmitir/${comp.id}`, {}).subscribe({
      next: (res: any) => {
        this.showMessage('success', res.message || 'Comprobante transmitido exitosamente');
        this.selectedComprobante = null;
        this.loadAllData();
      },
      error: (err: any) => {
        this.showMessage('error', err.error?.error || 'Error al transmitir el comprobante');
        this.loading = false;
      }
    });
  }

  transmitirLote() {
    this.loading = true;
    this.apiService.post<any>('/contabilidad/transmitir-lote', {}).subscribe({
      next: (res: any) => {
        this.showMessage('success', res.message || 'Lote transmitido correctamente');
        this.loadAllData();
      },
      error: (err: any) => {
        this.showMessage('error', err.error?.error || 'Error al transmitir el lote');
        this.loading = false;
      }
    });
  }

  openMapeoModal(mapeo?: MapeoCuenta) {
    if (mapeo) {
      this.mapeoForm = { ...mapeo };
    } else {
      this.mapeoForm = {
        modulo_origen: 'CXP',
        concepto_operacion: '',
        cuenta_contable: '',
        nombre_cuenta: '',
        estatus: 'Activo'
      };
    }
    this.showMapeoModal = true;
  }

  saveMapeo() {
    if (!this.mapeoForm.concepto_operacion || !this.mapeoForm.cuenta_contable || !this.mapeoForm.nombre_cuenta) {
      this.showMessage('error', 'Por favor complete los campos obligatorios del mapeo');
      return;
    }
    this.apiService.post<any>('/contabilidad/mapeos', this.mapeoForm).subscribe({
      next: () => {
        this.showMessage('success', 'Mapeo contable guardado exitosamente');
        this.showMapeoModal = false;
        this.loadAllData();
      },
      error: (err: any) => {
        this.showMessage('error', err.error?.error || 'Error al guardar el mapeo');
      }
    });
  }

  deleteMapeo(id?: number) {
    if (!id) return;
    if (confirm('¿Está seguro de eliminar esta regla de mapeo?')) {
      this.apiService.delete<any>(`/contabilidad/mapeos/${id}`).subscribe({
        next: () => {
          this.showMessage('success', 'Regla de mapeo eliminada');
          this.loadAllData();
        },
        error: (err: any) => {
          this.showMessage('error', err.error?.error || 'Error al eliminar regla');
        }
      });
    }
  }

  private showMessage(type: 'success' | 'error', msg: string) {
    this.messageType = type;
    this.message = msg;
    setTimeout(() => {
      if (this.message === msg) this.message = '';
    }, 5000);
  }
}
