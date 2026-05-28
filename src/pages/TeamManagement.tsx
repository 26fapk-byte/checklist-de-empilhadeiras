import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Info,
  ShieldCheck
} from 'lucide-react';

interface NewProfileForm {
  fullName: string;
  email: string;
  password: string;
  role: 'operador' | 'gerente';
}

interface UserProfileRow {
  id: string;
  email: string;
  full_name?: string;
  nivel_acesso: 'operador' | 'gerente' | 'master';
}

export default function TeamManagement() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [profiles, setProfiles] = useState<UserProfileRow[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  const isSupabaseReady = Boolean(supabase);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<NewProfileForm>({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: 'operador'
    }
  });

  const watchPassword = watch('password') || '';
  const watchEmail = watch('email') || '';
  const isEmailValid = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(watchEmail);

  const canCreateManager = user?.role === 'master';

  const fetchProfiles = async () => {
    if (!isSupabaseReady || !supabase) {
      setLoadingProfiles(false);
      return;
    }

    setLoadingProfiles(true);
    const { data, error } = await supabase
      .from('perfis_usuarios')
      .select('id, email, full_name, nivel_acesso')
      .order('email', { ascending: true });

    if (error) {
      setProfiles([]);
    } else if (data) {
      setProfiles(data as UserProfileRow[]);
    }
    setLoadingProfiles(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const onSubmit = async (values: NewProfileForm) => {
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseReady || !supabase) {
      setErrorMsg('Supabase não está configurado. O cadastro de colaboradores não é possível no momento.');
      setSubmitting(false);
      return;
    }

    try {
      const assignedRole = canCreateManager ? values.role : 'operador';
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName
          }
        }
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (!signUpData.user) {
        throw new Error('Não foi possível gerar o usuário no provedor de autenticação.');
      }

      const { error: profileError } = await supabase
        .from('perfis_usuarios')
        .insert({
          id: signUpData.user.id,
          email: values.email,
          full_name: values.fullName,
          nivel_acesso: assignedRole
        });

      if (profileError) {
        throw new Error('Usuário criado, mas falha ao salvar perfil de acesso: ' + profileError.message);
      }

      setSuccessMsg(`Colaborador ${values.fullName} cadastrado como ${assignedRole}.`);
      reset({ fullName: '', email: '', password: '', role: 'operador' });
      fetchProfiles();
    } catch (err: any) {
      const message = err?.message ?? 'Erro ao cadastrar colaborador.';
      if (message.includes('already registered')) {
        setErrorMsg('Este e-mail já existe no sistema. Utilize outro e-mail de acesso.');
      } else {
        setErrorMsg(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveProfile = async (id: string) => {
    if (!isSupabaseReady || !supabase || !canCreateManager) {
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('perfis_usuarios').delete().eq('id', id);
    if (error) {
      setErrorMsg('Falha ao remover o perfil: ' + error.message);
    } else {
      setSuccessMsg('Perfil removido com sucesso.');
      setProfiles((prev) => prev.filter((profile) => profile.id !== id));
    }
    setSubmitting(false);
  };

  const sortedProfiles = useMemo(() => {
    return [...profiles].sort((a, b) => {
      const rank = { master: 0, gerente: 1, operador: 2 };
      return rank[a.nivel_acesso] - rank[b.nivel_acesso] || a.email.localeCompare(b.email);
    });
  }, [profiles]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-[#1E3A8A]" />
              <span>Gestão de Acesso LogiCheck</span>
            </h1>
            <p className="text-xs text-[#6C797B] max-w-2xl">
              Cadastre novos usuários de campo e mantenha o controle de acesso em ambiente seguro e mobile-first.
            </p>
          </div>
          <div className="text-xs text-[#6C797B] bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 rounded-lg max-w-[320px]">
            <span className="font-semibold">Modo de criação:</span>{' '}
            {canCreateManager ? 'Master pode criar gerentes e operadores.' : 'Gerentes só podem criar operadores.'}
          </div>
        </div>

        {!isSupabaseReady && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-700 p-4 text-sm">
            <strong>Atenção:</strong> Supabase não está configurado. O cadastro de colaboradores não pode ser concluído.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white border border-slate-200/80 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-[#1E3A8A] mb-5">
            <UserPlus className="w-4 h-4" />
            <span>Novo Colaborador</span>
          </div>

          {successMsg && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 text-sm">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Sucesso</span>
              </div>
              <p className="mt-2 text-xs">{successMsg}</p>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 text-sm">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Erro</span>
              </div>
              <p className="mt-2 text-xs">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6C797B]">
                Nome completo
              </label>
              <input
                type="text"
                {...register('fullName', { required: 'Informe o nome completo do colaborador.' })}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#1E293B] focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
                placeholder="Carlos Eduardo"
              />
              {errors.fullName && <p className="text-[11px] text-red-600">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6C797B]">
                E-mail corporativo
              </label>
              <input
                type="email"
                {...register('email', {
                  required: 'Informe o e-mail corporativo.',
                  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'E-mail inválido.' }
                })}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#1E293B] focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
                placeholder="nova.pessoa@tkflogicheck.com"
              />
              {errors.email && <p className="text-[11px] text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6C797B]">
                Senha inicial
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Informe a senha inicial.',
                    minLength: { value: 6, message: 'A senha precisa ter ao menos 6 caracteres.' }
                  })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 pr-10 text-sm text-[#1E293B] focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
                  placeholder="••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6C797B]">
                Nível de acesso
              </label>
              <select
                {...register('role')}
                disabled={!canCreateManager}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#1E293B] focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
              >
                <option value="operador">Operador</option>
                <option value="gerente">Gerente</option>
              </select>
              {!canCreateManager && (
                <p className="text-[11px] text-[#6C797B] mt-1">Gerentes só podem criar operadores.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[#1E3A8A] px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#152e72] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Cadastrando...' : 'Cadastrar colaborador'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[#1E3A8A]">Colaboradores Cadastrados</h2>
              <p className="text-[11px] text-[#6C797B] mt-1">Lista de acessos que foram registrados nesta instância do sistema.</p>
            </div>
            <span className="text-[11px] bg-[#E6F7F8] border border-[#1e3a8a] text-[#006970] px-3 py-2 rounded-full font-semibold">
              {sortedProfiles.length} perfis
            </span>
          </div>

          {loadingProfiles ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-sm text-[#6C797B]">
              <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
              <span>Sincronizando perfis...</span>
            </div>
          ) : sortedProfiles.length === 0 ? (
            <div className="py-12 text-center text-[#6C797B] text-sm">Nenhum perfil disponível no momento.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12px] text-[#1E293B]">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#6C797B] uppercase tracking-[0.18em] text-[10px]">
                    <th className="py-3 px-2">ID</th>
                    <th className="py-3 px-2">Nome / E-mail</th>
                    <th className="py-3 px-2">Cargo</th>
                    <th className="py-3 px-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProfiles.map((profile) => (
                    <tr key={profile.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-2 font-semibold">{profile.id.slice(0, 8)}</td>
                      <td className="py-3 px-2 space-y-1">
                        <div className="font-semibold text-[#0f172a]">{profile.full_name || profile.email}</div>
                        <div className="text-[11px] text-[#6C797B]">{profile.email}</div>
                      </td>
                      <td className="py-3 px-2 font-semibold text-[#1E3A8A]">{profile.nivel_acesso}</td>
                      <td className="py-3 px-2 text-right">
                        {canCreateManager ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveProfile(profile.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-[#F1F4F6] bg-[#FEF2F2] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#981B1B] hover:bg-[#FEE2E2] transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Excluir
                          </button>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-[#F8FAFC] px-3 py-2 text-[10px] text-[#6C797B] uppercase tracking-[0.16em]">Sem permissão</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 text-[11px] text-[#3D494A]">
        <div className="flex items-center gap-2 font-semibold text-[#0F172A] mb-2">
          <Info className="w-4 h-4" />
          Painel de observações de governança
        </div>
        <p>
<<<<<<< HEAD
          A criaÃ§Ã£o de usuÃ¡rios no frontend integra Supabase Auth e a tabela <code className="rounded bg-white px-1 py-0.5">perfis_usuarios</code>.
          O papel de gerente sÃ³ pode ser criado por usuÃ¡rios com nÃ­vel master. Gerentes comuns criam somente operadores.
=======
          A criação de usuários no frontend integra Supabase Auth e a tabela <code className="rounded bg-white px-1 py-0.5">perfis_usuarios</code>.
          O papel de gerente só aparece para o master <strong>flavio.frire@ativa.com</strong>. Gerentes comuns criam somente operadores.
>>>>>>> baeeec2 (fix: normalize dashboard terminology to checklist system)
        </p>
      </div>
    </div>
  );
}
