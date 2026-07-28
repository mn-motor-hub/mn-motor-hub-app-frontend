'use client'; // useActionState para mostrar el error del backend en el form

import { useActionState } from 'react';
import Image from 'next/image';
import { loginAction, type LoginState } from './actions';
import styles from './login.module.css';

const INITIAL_STATE: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, INITIAL_STATE);

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Image
            src="/images/logo.svg"
            alt="MN Motor Hub"
            width={48}
            height={48}
            priority
          />
          <h1 className={styles.title}>MN Motor Hub</h1>
          <p className={styles.subtitle}>Ingresá para acceder al panel</p>
        </div>

        <form action={formAction} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              className={styles.input}
              placeholder="tu@email.com"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={styles.input}
            />
          </div>

          {state.error && (
            <p className={styles.error} role="alert">
              {state.error}
            </p>
          )}

          <button type="submit" className={styles.submit} disabled={pending}>
            {pending ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  );
}
