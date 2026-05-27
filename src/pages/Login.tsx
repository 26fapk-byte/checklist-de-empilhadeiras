import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  Truck,
  CheckCircle2,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [reqError, setReqError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: ''
    },
    mode: 'onChange' // Validate in real time
  });

  // Watch inputs for real-time visual feedback
  const emailValue = watch('email') || '';
  const passwordValue = watch('password') || '';

  // Email validation check
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  const isEmailValid = emailRegex.test(emailValue);
  const showEmailStatus = emailValue.length > 0;

  // Password strength logic
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: 'bg-slate-200' });

  useEffect(() => {
    if (!passwordValue) {
      setPasswordStrength({ score: 0, label: '', color: 'bg-slate-200' });
      return;
    }

    let score = 0;
    if (passwordValue.length >= 6) score += 1;
    if (passwordValue.length >= 8) score += 1;
    if (/[0-9]/.test(passwordValue)) score += 1;
    if (/[A-Z]/.test(passwordValue) || /[^A-Za-z0-9]/.test(passwordValue)) score += 1;

    let label = 'Muito Fraca';
    let color = 'bg-red-500';

    if (score === 2) {
      label = 'Fraca';
      color = 'bg-orange-500';
    } else if (score === 3) {
      label = 'Média';
      color = 'bg-amber-500';
    } else if (score >= 4) {
      label = 'Forte e Segura';
      color = 'bg-emerald-600';
    }

    setPasswordStrength({ score, label, color });
  }, [passwordValue]);

  const onSubmit = async (data: any) => {
    setReqError(null);
    setSubmitting(true);
    try {
      const res = await login(data.email, data.password);
      if (!res.success) {
        setReqError(res.error || 'Falha na autenticação corporativa.');
      }
    } catch (e: any) {
      setReqError('Conectividade interrompida. Verifique sua rede e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC] relative overflow-hidden font-sans select-none">
      
      {/* Subtle brand top layout bar - corporate style */}
      <div className="absolute inset-x-0 top-0 h-1.5 bg-[#1E3A8A] z-10" />

      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-[420px] flex flex-col gap-6">
          
          {/* Logo & Sólido Brand Header */}
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center border border-slate-200 mb-4 shadow-sm">
              <Truck className="w-7 h-7 text-[#1E3A8A]" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
              <span>Logi</span>
              <span className="text-[#1E3A8A]">Check</span>
            </h1>
            <p className="text-xs text-slate-500 mt-2 max-w-[320px] leading-relaxed">
              Inspeção digital, auditoria e controle operacional de ativos logísticos com alta precisão.
            </p>
          </div>

          {/* Login Pure White Card */}
          <div className="bg-white border border-slate-200/80 p-8 rounded-xl shadow-sm">
            
            {reqError && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-lg flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{reqError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              {/* Email Input with Real-time visual feedback */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-750 block" htmlFor="email">
                    E-mail Corporativo
                  </label>
                  {showEmailStatus && (
                    <span className="text-[10px] flex items-center gap-1">
                      {isEmailValid ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Válido
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Incompleto</span>
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    placeholder="carlos.silva@logicheck.com"
                    autoComplete="email"
                    className={`w-full h-11 pl-10 pr-4 bg-white border ${
                      !showEmailStatus 
                        ? 'border-slate-300 focus:border-[#1E3A8A]' 
                        : isEmailValid 
                          ? 'border-emerald-500 focus:border-emerald-600 focus:ring-emerald-155' 
                          : 'border-amber-450 focus:border-amber-600 focus:ring-amber-155'
                    } rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all placeholder-slate-400`}
                    {...register('email', { 
                      required: 'O e-mail corporativo é obrigatório',
                      pattern: {
                        value: emailRegex,
                        message: 'Por favor, insira um e-mail com formato válido'
                      }
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Input with strength meter */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-750" htmlFor="password">
                    Senha de Acesso
                  </label>
                  <a 
                    href="mailto:suporte@logicheck.com?subject=Recuperação de Senha LogiCheck" 
                    className="text-[11px] text-[#1E3A8A] hover:text-blue-800 font-semibold hover:underline transition-colors"
                  >
                    Esqueceu a senha?
                  </a>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full h-11 pl-10 pr-11 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#1E3A8A] focus:ring-4 focus:ring-blue-600/5 transition-all placeholder-slate-400"
                    {...register('password', {
                      required: 'A senha é necessária',
                      minLength: { value: 6, message: 'Senha deve conter no mínimo 6 caracteres' }
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                    title={showPassword ? "Ocultar senha" : "Exibir senha"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordValue.length > 0 && (
                  <div className="pt-1 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">Segurança da senha:</span>
                      <span className="font-bold text-slate-700">{passwordStrength.label}</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                      <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${
                        passwordStrength.score >= 1 ? 'w-1/4' : 'w-0'
                      }`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${
                        passwordStrength.score >= 2 ? 'w-1/4' : 'w-0'
                      }`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${
                        passwordStrength.score >= 3 ? 'w-1/4' : 'w-0'
                      }`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${
                        passwordStrength.score >= 4 ? 'w-1/4' : 'w-0'
                      }`} />
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Login Button with massive touch target size for operators (WCAG accessible) */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 bg-[#1E3A8A] hover:bg-[#152e72] active:bg-[#0f2152] text-white rounded-lg font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <span>Entrar no Sistema</span>
                )}
              </button>

            </form>
          </div>

          {/* Secure Environment Footer Info */}
          <div className="text-center text-slate-500 text-[11px] space-y-1.5 mt-2">
            <p className="flex items-center justify-center gap-1 text-slate-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Conexão criptografada de nível corporativo</span>
            </p>
            <p className="opacity-60">
              LogiCheck &copy; 2026 &bull; Plataforma SaaS Operacional
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
