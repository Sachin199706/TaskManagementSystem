import { createAction, createFeatureSelector, createReducer, createSelector, on, props } from "@ngrx/store";
import { AuthResponse, AuthService } from "../core/services/auth.service";
import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { catchError, map, of, switchMap, tap } from "rxjs";
import { Router } from "@angular/router";

export interface AuthState {
    user: AuthResponse | null;
    loading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null, loading: false, error: null
};

// ── Actions ──────────────────────────────────────────────────────
export const AuthActions = {
    login: createAction('[Auth] Login', props<{ username: string; password: string }>()),
    loginSuccess: createAction('[Auth] Login Success', props<{ user: AuthResponse }>()),
    loginFailure: createAction('[Auth] Login Failure', props<{ error: string }>()),
    logout: createAction('[Auth] Logout'),
    logoutSuccess: createAction('[Auth] Logout Success'),
};

// ── Reducer ──────────────────────────────────────────────────────
export const authReducer = createReducer(initialState,
    on(AuthActions.login, s => ({ ...s, loading: true, error: null })),
    on(AuthActions.loginSuccess, (s, { user }) => ({ ...s, loading: false, user })),
    on(AuthActions.loginFailure, (s, { error }) => ({ ...s, loading: false, error })),
    on(AuthActions.logoutSuccess, () => initialState),
);

// ── Selectors ────────────────────────────────────────────────────
const selectAuthFeature = createFeatureSelector<AuthState>('auth');
export const selectCurrentUser = createSelector(selectAuthFeature, s => s.user);
export const selectAuthLoading = createSelector(selectAuthFeature, s => s.loading);
export const selectAuthError = createSelector(selectAuthFeature, s => s.error);
export const selectIsAdmin = createSelector(selectAuthFeature,
    s => s.user?.role === 'Admin');

// ── Effects ──────────────────────────────────────────────────────
@Injectable()
export class AuthEffects {
    private actions$: Actions = inject(Actions);
    private authSvc: AuthService = inject(AuthService);
    private router: Router = inject(Router);

    login$ = createEffect(() => this.actions$.pipe(
        ofType(AuthActions.login),
        switchMap(({ username, password }) =>
            this.authSvc.login({ username, password }).pipe(
                map(user => AuthActions.loginSuccess({ user })),
                catchError(err => of(AuthActions.loginFailure({ error: err.error?.error || 'Login failed' })))
            )
        )
    ));

    loginSuccess$ = createEffect(() => this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(() => this.router.navigate(['/dashboard']))
    ), { dispatch: false });

    logout$ = createEffect(() => this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => { this.authSvc.logOut(); }),
        map(() => AuthActions.logoutSuccess())
    ));

}