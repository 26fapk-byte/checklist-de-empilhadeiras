# 💡 GUIA PRÁTICO: MELHORIAS AVANÇADAS PARA PWA LOGICHECK

---

## 📋 ÍNDICE
1. Push Notifications
2. Background Sync
3. Camera & Photo Storage
4. Exportação CSV/PDF
5. Dark Mode
6. Biometric Authentication
7. Offline Analytics
8. Real-time Sync com WebSocket
9. Voice Input
10. Integração com Google Drive

---

## 1️⃣ PUSH NOTIFICATIONS

### Instalação
```bash
npm install web-push
```

### Arquivo: `src/lib/notifications.ts`
```typescript
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export async function subscribeToNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.error('Push notifications not supported');
    return null;
  }

  const permission = await requestNotificationPermission();
  if (!permission) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.VITE_PUSH_PUBLIC_KEY
    });

    // Enviar subscription para backend
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

    return subscription;
  } catch (error) {
    console.error('Falha ao se inscrever em notificações:', error);
    return null;
  }
}

export function showNotification(title: string, options?: NotificationOptions) {
  if ('Notification' in window && Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/manifest.json',
      badge: 'https://cdn-icons-png.flaticon.com/512/9356/9356230.png',
      ...options
    });
  }
}
```

### No Service Worker (`public/sw.js`), adicionar:
```javascript
// Lidar com push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'LogiCheck Notificação';
  const options = {
    body: data.body || '',
    icon: '/manifest.json',
    badge: 'https://cdn-icons-png.flaticon.com/512/9356/9356230.png',
    tag: 'logicheck-notification',
    requireInteraction: data.requireInteraction || false,
    data: data.data || {}
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
```

### Usar em Componente
```typescript
import { showNotification, subscribeToNotifications } from '../lib/notifications';

export default function NewRecord() {
  // ...
  
  const handleSave = async () => {
    // ... salvar registro ...
    
    if (status === 'NOK') {
      showNotification('⚠️ Falha Detectada!', {
        body: `${item} está com NOK. Ação necessária.`,
        requireInteraction: true,
        data: { recordId: id }
      });
    } else {
      showNotification('✅ Registro Salvo', {
        body: 'Checklist foi sincronizado com sucesso.'
      });
    }
  };

  return (
    <button 
      onClick={() => subscribeToNotifications()}
      className="btn btn-sm"
    >
      Ativar Notificações
    </button>
  );
}
```

---

## 2️⃣ BACKGROUND SYNC

### Arquivo: `public/sw.js` (Adicionar)
```javascript
// Background Sync para sincronizar registros offline
self.addEventListener('sync', (event) => {
  console.log('[BG Sync] Sincronizando registros...');
  
  if (event.tag === 'sync-records') {
    event.waitUntil(syncPendingRecords());
  }
});

async function syncPendingRecords() {
  try {
    const db = await indexedDB.open('logicheck', 1);
    const tx = db.transaction('pendingRecords', 'readonly');
    const records = await tx.objectStore('pendingRecords').getAll();

    for (const record of records) {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });

      if (response.ok) {
        // Remover do pending após sucesso
        const deleteTx = db.transaction('pendingRecords', 'readwrite');
        await deleteTx.objectStore('pendingRecords').delete(record.id);
      }
    }

    console.log('[BG Sync] ✅ Sincronização completa');
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'SYNC_COMPLETE' });
      });
    });
  } catch (error) {
    console.error('[BG Sync] ❌ Erro:', error);
    throw error; // Retenar para tentar novamente
  }
}
```

### Arquivo: `src/lib/backgroundSync.ts`
```typescript
export async function registerBackgroundSync() {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.log('Background Sync not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-records');
    console.log('✅ Background Sync registered');
  } catch (error) {
    console.error('Erro ao registrar Background Sync:', error);
  }
}

export async function requestBackgroundSync() {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.log('Background Sync not supported - manual sync required');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const tags = await registration.sync.getTags();
    
    if (!tags.includes('sync-records')) {
      await registration.sync.register('sync-records');
    }

    return true;
  } catch (error) {
    console.error('Erro ao registrar sync:', error);
    return false;
  }
}
```

### Usar no App
```typescript
import { registerBackgroundSync } from './lib/backgroundSync';

function App() {
  useEffect(() => {
    registerBackgroundSync();
  }, []);
  
  // ...
}
```

---

## 3️⃣ CAMERA & PHOTO STORAGE

### Instalação
```bash
npm install html5-qrcode
```

### Arquivo: `src/components/CameraCapture.tsx`
```typescript
import React, { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsOpen(true);
      }
    } catch (error) {
      alert('Erro ao acessar câmera. Verifique permissões.');
      console.error(error);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File(
          [blob], 
          `photo_${Date.now()}.jpg`, 
          { type: 'image/jpeg' }
        );
        onCapture(file);
        stopCamera();
        setIsOpen(false);
      }
    }, 'image/jpeg', 0.9);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  return (
    <>
      <button
        onClick={startCamera}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        <Camera className="w-4 h-4" />
        Capturar Foto
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <button
              onClick={capturePhoto}
              className="px-6 py-3 bg-green-600 text-white rounded-full text-lg font-bold hover:bg-green-700"
            >
              ✓ Usar Foto
            </button>
            <button
              onClick={() => {
                stopCamera();
                setIsOpen(false);
              }}
              className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

### Salvar no Supabase Storage
```typescript
export async function uploadPhotoToSupabase(
  file: File,
  recordId: string
): Promise<string | null> {
  if (!supabase) return null;

  const fileName = `records/${recordId}/${Date.now()}_${file.name}`;

  const { data, error } = await supabase.storage
    .from('checklist-photos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Erro ao upload:', error);
    return null;
  }

  // Retornar URL pública
  const { data: publicUrl } = supabase.storage
    .from('checklist-photos')
    .getPublicUrl(fileName);

  return publicUrl.publicUrl;
}
```

---

## 4️⃣ EXPORTAÇÃO CSV/PDF

### Instalação
```bash
npm install jspdf html2canvas papaparse
npm install -D @types/papaparse
```

### Arquivo: `src/lib/export.ts`
```typescript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';
import { ChecklistRecord } from '../types';

export function exportToCSV(records: ChecklistRecord[], filename = 'registros.csv') {
  const data = records.map(r => ({
    'Data': r.data,
    'Hora': r.hora,
    'Operador': r.operador,
    'Equipamento': r.equipamento,
    'Item': r.item,
    'Status': r.status,
    'Observação': r.observacao,
    'Patrimônio': r.patrimonio,
    'Horímetro': r.horimetro
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportToPDF(
  records: ChecklistRecord[],
  title = 'Relatório de Checklists',
  filename = 'relatorio.pdf'
) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Título
  pdf.setFontSize(16);
  pdf.text(title, 10, 10);

  // Data de geração
  pdf.setFontSize(10);
  pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 10, 20);

  // Tabela
  pdf.setFontSize(9);
  let y = 30;
  const pageHeight = pdf.internal.pageSize.getHeight();

  records.forEach((record, index) => {
    if (y > pageHeight - 20) {
      pdf.addPage();
      y = 10;
    }

    pdf.text(`${index + 1}. ${record.data} ${record.hora} - ${record.operador}`, 10, y);
    pdf.text(`   ${record.equipamento}`, 10, y + 5);
    pdf.text(`   ${record.item}: ${record.status}`, 10, y + 10);

    if (record.observacao) {
      pdf.setFontSize(8);
      pdf.text(`   Obs: ${record.observacao}`, 10, y + 15);
      pdf.setFontSize(9);
      y += 20;
    } else {
      y += 15;
    }
  });

  pdf.save(filename);
}

export async function exportTableToPDF(
  elementId: string,
  filename = 'table.pdf'
) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const imgWidth = 280;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
  pdf.save(filename);
}
```

### Usar em Componente
```typescript
import { exportToCSV, exportToPDF } from '../lib/export';

export default function History() {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => exportToCSV(filteredRecords, 'checklists.csv')}
        className="btn btn-secondary"
      >
        📊 CSV
      </button>
      <button
        onClick={() => exportToPDF(filteredRecords, 'Relatório de Checklists')}
        className="btn btn-secondary"
      >
        📄 PDF
      </button>
      <button
        onClick={() => exportTableToPDF('history-table', 'tabela.pdf')}
        className="btn btn-secondary"
      >
        🗂️ Tabela PDF
      </button>
    </div>
  );
}
```

---

## 5️⃣ DARK MODE

### Arquivo: `src/lib/theme.ts`
```typescript
export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'logicheck_theme';

export function getTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  return stored || 'system';
}

export function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export function applyTheme(theme: Theme) {
  const isDark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function useTheme() {
  const [theme, setLocalTheme] = React.useState<Theme>(() => getTheme());

  React.useEffect(() => {
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    const matcher = window.matchMedia('(prefers-color-scheme: dark)');
    matcher.addEventListener('change', handleChange);

    applyTheme(theme);

    return () => matcher.removeEventListener('change', handleChange);
  }, [theme]);

  return {
    theme,
    setTheme: (newTheme: Theme) => {
      setLocalTheme(newTheme);
      setTheme(newTheme);
    }
  };
}
```

### Componente Theme Switcher
```typescript
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../lib/theme';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded ${theme === 'light' ? 'bg-white dark:bg-gray-600' : ''}`}
        title="Light mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded ${theme === 'dark' ? 'bg-gray-600' : ''}`}
        title="Dark mode"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded ${theme === 'system' ? 'bg-gray-600' : ''}`}
        title="System theme"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}
```

### Tailwind Config (`tailwind.config.js`)
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f8fafc',
          900: '#0f172a'
        }
      }
    }
  },
  plugins: []
}
```

---

## 6️⃣ BIOMETRIC AUTHENTICATION

### Arquivo: `src/lib/biometric.ts`
```typescript
export async function registerBiometric(): Promise<boolean> {
  if (!window.PublicKeyCredential) {
    console.log('WebAuthn not supported');
    return false;
  }

  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: new Uint8Array(32),
        rp: {
          name: 'LogiCheck',
          id: window.location.hostname
        },
        user: {
          id: new Uint8Array(16),
          name: 'user@logicheck.com',
          displayName: 'User'
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }
        ],
        timeout: 60000,
        attestation: 'direct',
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          residentKey: 'required'
        }
      }
    });

    if (credential) {
      // Salvar credential em localStorage
      localStorage.setItem('biometric_registered', 'true');
      return true;
    }
  } catch (error) {
    console.error('Erro ao registrar biométrico:', error);
  }

  return false;
}

export async function authenticateWithBiometric(): Promise<boolean> {
  if (!window.PublicKeyCredential) {
    return false;
  }

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32),
        timeout: 60000,
        rpId: window.location.hostname,
        userVerification: 'preferred'
      }
    });

    return !!assertion;
  } catch (error) {
    console.error('Erro na autenticação biométrica:', error);
    return false;
  }
}

export function isBiometricAvailable(): boolean {
  return (
    !!window.PublicKeyCredential &&
    localStorage.getItem('biometric_registered') === 'true'
  );
}
```

### Usar no Login
```typescript
import { authenticateWithBiometric } from '../lib/biometric';

export default function Login() {
  const handleBiometricLogin = async () => {
    const success = await authenticateWithBiometric();
    if (success) {
      // Auto-login com credenciais salvas
      login(savedEmail, savedPassword);
    }
  };

  return (
    <>
      {isBiometricAvailable() && (
        <button
          onClick={handleBiometricLogin}
          className="btn btn-outline w-full"
        >
          👆 Login Biométrico
        </button>
      )}
    </>
  );
}
```

---

## 7️⃣ OFFLINE ANALYTICS

### Arquivo: `src/lib/offlineAnalytics.ts`
```typescript
interface AnalyticsEvent {
  name: string;
  timestamp: number;
  data?: Record<string, any>;
}

const DB_NAME = 'logicheck_analytics';
const STORE_NAME = 'events';

export async function trackEvent(name: string, data?: Record<string, any>) {
  const event: AnalyticsEvent = {
    name,
    timestamp: Date.now(),
    data
  };

  // Salvar localmente
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).add(event);

  // Tentar enviar ao servidor
  if (navigator.onLine) {
    await syncAnalytics();
  }
}

async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);

    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { autoIncrement: true });
      }
    };
  });
}

export async function syncAnalytics() {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const events = await tx.objectStore(STORE_NAME).getAll();

  if (events.length === 0) return;

  try {
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(events)
    });

    // Limpar após sucesso
    const delTx = db.transaction(STORE_NAME, 'readwrite');
    delTx.objectStore(STORE_NAME).clear();
  } catch (error) {
    console.log('Analytics sync failed, will retry later:', error);
  }
}

// Auto-sync quando voltar online
window.addEventListener('online', () => syncAnalytics());
```

### Usar no Componente
```typescript
import { trackEvent } from '../lib/offlineAnalytics';

export default function NewRecord() {
  const handleSave = async () => {
    // ... salvar ...
    trackEvent('checklist_saved', {
      equipamento: equipment,
      status: 'success',
      duration: Date.now() - startTime
    });
  };

  const handleError = () => {
    trackEvent('checklist_error', {
      errorMessage: 'Validation failed'
    });
  };
}
```

---

## 8️⃣ REAL-TIME SYNC COM WEBSOCKET

### Arquivo: `src/lib/realtimeSync.ts`
```typescript
import { supabase } from './supabase';
import { ChecklistRecord } from '../types';

export class RealtimeSync {
  private subscription: any = null;

  subscribe(callback: (record: ChecklistRecord) => void) {
    if (!supabase) return;

    this.subscription = supabase
      .from('registros_checklist')
      .on('*', (payload) => {
        console.log('Real-time update:', payload);
        callback(payload.new as ChecklistRecord);
      })
      .subscribe();
  }

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  // Mais específico: apenas registros do equipamento atual
  subscribeToEquipment(patrimonio: string, callback: (record: ChecklistRecord) => void) {
    if (!supabase) return;

    this.subscription = supabase
      .from('registros_checklist')
      .on('INSERT', (payload) => {
        const record = payload.new as ChecklistRecord;
        if (record.patrimonio === patrimonio) {
          callback(record);
        }
      })
      .subscribe();
  }
}

export const realtime = new RealtimeSync();
```

### Usar em Dashboard
```typescript
import { realtime } from '../lib/realtimeSync';

export default function Dashboard() {
  const [records, setRecords] = useState<ChecklistRecord[]>([]);

  useEffect(() => {
    // Carregar histórico
    setRecords(LocalDb.getRecords());

    // Listar por novos registros em tempo real
    realtime.subscribe((newRecord) => {
      setRecords(prev => [newRecord, ...prev]);
      // Notificar usuário
      showNotification('📋 Novo registro!', {
        body: `${newRecord.operador} criou um checklist`
      });
    });

    return () => realtime.unsubscribe();
  }, []);

  return (
    // ...
  );
}
```

---

## 9️⃣ VOICE INPUT

### Arquivo: `src/components/VoiceInput.tsx`
```typescript
import React, { useState } from 'react';
import { Mic, X } from 'lucide-react';

interface VoiceInputProps {
  onResult: (text: string) => void;
}

export default function VoiceInput({ onResult }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition não suportado neste navegador');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setTranscript(transcript);
          onResult(transcript);
        } else {
          interimTranscript += transcript;
        }
      }
    };
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={startListening}
        disabled={isListening}
        className={`p-2 rounded-full ${
          isListening
            ? 'bg-red-500 animate-pulse'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
        title="Falar observação"
      >
        <Mic className="w-5 h-5" />
      </button>

      {transcript && (
        <div className="flex gap-1 items-center">
          <span className="text-sm text-gray-700">{transcript}</span>
          <button
            onClick={() => setTranscript('')}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
```

### Usar em NewRecord
```typescript
import VoiceInput from '../components/VoiceInput';

export default function NewRecord() {
  const handleVoiceInput = (text: string) => {
    // Adicionar ao campo de observação
    setItemsObservations(prev => ({
      ...prev,
      [currentItem]: prev[currentItem] ? `${prev[currentItem]} ${text}` : text
    }));
  };

  return (
    <div className="space-y-4">
      <VoiceInput onResult={handleVoiceInput} />
      {/* ... resto do formulário */}
    </div>
  );
}
```

---

## 🔟 INTEGRAÇÃO COM GOOGLE DRIVE

### Instalação
```bash
npm install @react-oauth/google
```

### Arquivo: `src/lib/googleDrive.ts`
```typescript
declare global {
  interface Window {
    gapi: any;
  }
}

const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export async function uploadToGoogleDrive(
  file: File,
  token: string
): Promise<string | null> {
  const metadata = {
    name: file.name,
    mimeType: file.type
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  try {
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form
    });

    const result = await response.json();
    return result.id; // File ID no Google Drive
  } catch (error) {
    console.error('Erro ao fazer upload para Google Drive:', error);
    return null;
  }
}

export async function createGoogleSheet(
  title: string,
  data: any[][],
  token: string
): Promise<string | null> {
  try {
    // Criar spreadsheet
    const spreadsheet = {
      properties: {
        title: title
      }
    };

    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(spreadsheet)
    });

    const result = await response.json();
    const spreadsheetId = result.spreadsheetId;

    // Adicionar dados
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: data
        })
      }
    );

    return spreadsheetId;
  } catch (error) {
    console.error('Erro ao criar Google Sheet:', error);
    return null;
  }
}
```

---

## 📊 RESUMO IMPLEMENTAÇÃO

| Feature | Dificuldade | Tempo | Impacto | Prioridade |
|---------|-------------|-------|--------|-----------|
| Push Notifications | Médio | 2-3h | Alto | 🔴 Alta |
| Background Sync | Alto | 3-4h | Alto | 🔴 Alta |
| Camera & Storage | Médio | 2-3h | Médio | 🟡 Média |
| CSV/PDF Export | Fácil | 1-2h | Alto | 🔴 Alta |
| Dark Mode | Fácil | 1h | Baixo | 🟢 Baixa |
| Biometric Auth | Médio | 2h | Médio | 🟡 Média |
| Offline Analytics | Médio | 2-3h | Médio | 🟡 Média |
| WebSocket Sync | Alto | 3-4h | Alto | 🔴 Alta |
| Voice Input | Fácil | 1-2h | Baixo | 🟢 Baixa |
| Google Drive | Médio | 2-3h | Médio | 🟡 Média |

---

**Total Estimado:** 18-28 horas de desenvolvimento (1-2 sprints)

*Documento prático com exemplos prontos para implementação imediata.*
