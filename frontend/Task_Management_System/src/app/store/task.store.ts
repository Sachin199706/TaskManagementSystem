import { createAction, createFeatureSelector, createReducer, createSelector, on, props } from "@ngrx/store";
import { PagedResult, SearchCriteria, TaskDetail, TaskService, TaskSummary } from "../core/services/task.service";
import { inject, Injectable } from "@angular/core";
import { catchError, map, of, switchMap } from "rxjs";
import { Actions } from '@ngrx/effects';


export interface TaskState {
    tasks: TaskSummary[];
    selectedTask: TaskDetail | null;
    total: number;
    page: number;
    pageSize: number;
    loading: boolean;
    error: string | null;
    searchCriteria: SearchCriteria;
}

const initialState: TaskState = {
    tasks: [],
    selectedTask: null,
    total: 0,
    page: 1,
    pageSize: 20,
    loading: false,
    error: null,
    searchCriteria: { sortBy: 'priority', sortDirection: 'desc', page: 1, pageSize: 20 }
};

//#region  Action
export const TaskActions = {
    loadTasks: createAction('[Tasks] Load', props<{ criteria: SearchCriteria }>()),
    loadTasksSuccess: createAction('[Tasks] Load Success',
        props<{ result: PagedResult<TaskSummary> }>()),
    loadTasksFailure: createAction('[Tasks] Load Failure', props<{ error: string }>()),

    loadTask: createAction('[Tasks] Load One', props<{ id: number }>()),
    loadTaskSuccess: createAction('[Tasks] Load One Success', props<{ task: TaskDetail }>()),
    loadTaskFailure: createAction('[Tasks] Load One Failure', props<{ error: string }>()),

    createTask: createAction('[Tasks] Create', props<{ req: any }>()),
    createTaskSuccess: createAction('[Tasks] Create Success', props<{ task: TaskDetail }>()),
    createTaskFailure: createAction('[Tasks] Create Failure', props<{ error: string }>()),

    updateTask: createAction('[Tasks] Update', props<{ id: number; req: any }>()),
    updateTaskSuccess: createAction('[Tasks] Update Success', props<{ task: TaskDetail }>()),

    changeStatus: createAction('[Tasks] Change Status',
        props<{ id: number; newStatus: string }>()),
    changeStatusSuccess: createAction('[Tasks] Change Status Success',
        props<{ task: TaskDetail }>()),
    changeStatusFailure: createAction('[Tasks] Change Status Failure',
        props<{ error: string }>()),

    deleteTask: createAction('[Tasks] Delete', props<{ id: number }>()),
    deleteTaskSuccess: createAction('[Tasks] Delete Success', props<{ id: number }>()),

    updateCriteria: createAction('[Tasks] Update Criteria',
        props<{ criteria: Partial<SearchCriteria> }>()),

    // Called by SignalR push
    taskUpdatedViaSignalR: createAction('[Tasks] SignalR Updated', props<{ taskId: number }>()),
};
//#endregion

//#region  Reducer
export const taskReducer = createReducer(initialState,
    on(TaskActions.loadTasks, s => ({ ...s, loading: true, error: null })),
    on(TaskActions.loadTasksSuccess, (s, { result }) => ({
        ...s, loading: false,
        tasks: result.items as TaskSummary[],
        total: result.total, page: result.page, pageSize: result.pageSize
    })),
    on(TaskActions.loadTasksFailure, (s, { error }) => ({ ...s, loading: false, error })),

    on(TaskActions.loadTask, s => ({ ...s, loading: true, selectedTask: null })),
    on(TaskActions.loadTaskSuccess, (s, { task }) => ({ ...s, loading: false, selectedTask: task })),

    on(TaskActions.createTaskSuccess, (s, { task }) => ({
        ...s,
        tasks: [
            {
                id: task.id,
                title: task.title,
                priority: task.priority,
                status: task.status,
                dueDate: task.dueDate,
                assigneeId: task.assigneeId,
                hasSubtasks: (task.subtasks?.length ?? 0) > 0,
                subtaskCount: task.subtasks?.length ?? 0
            } as TaskSummary,
            ...s.tasks
        ],
        total: s.total + 1
    })),

    on(TaskActions.changeStatusSuccess, (s, { task }) => ({
        ...s,
        tasks: s.tasks.map(t => t.id === task.id
            ? { ...t, status: task.status } : t),
        selectedTask: s.selectedTask?.id === task.id ? task : s.selectedTask
    })),
    on(TaskActions.changeStatusFailure, (s, { error }) => ({ ...s, error })),

    on(TaskActions.deleteTaskSuccess, (s, { id }) => ({
        ...s, tasks: s.tasks.filter(t => t.id !== id), total: s.total - 1
    })),

    on(TaskActions.updateCriteria, (s, { criteria }) => ({
        ...s, searchCriteria: { ...s.searchCriteria, ...criteria }
    })),
);
//#endregion

//#region  Selectors
const selectTaskFeature = createFeatureSelector<TaskState>('tasks');
export const selectTasks = createSelector(selectTaskFeature, s => s.tasks);
export const selectSelectedTask = createSelector(selectTaskFeature, s => s.selectedTask);
export const selectTasksLoading = createSelector(selectTaskFeature, s => s.loading);
export const selectTasksError = createSelector(selectTaskFeature, s => s.error);
export const selectTasksPagination = createSelector(selectTaskFeature,
    s => ({ total: s.total, page: s.page, pageSize: s.pageSize }));
export const selectSearchCriteria = createSelector(selectTaskFeature, s => s.searchCriteria);


//#endregion


@Injectable()
export class TaskEffects {
    private actions$ = inject(Actions);
    private taskSvc = inject(TaskService);

    loadTasks$ = createEffect(() => this.actions$.pipe(
        ofType(TaskActions.loadTasks),
        switchMap(({ criteria }) =>
            this.taskSvc.search(criteria).pipe(
                map(result => TaskActions.loadTasksSuccess({ result })),
                catchError(err => of(TaskActions.loadTasksFailure({ error: err.message })))
            )
        )
    ));

    loadTask$ = createEffect(() => this.actions$.pipe(
        ofType(TaskActions.loadTask),
        switchMap(({ id }) =>
            this.taskSvc.getById(id).pipe(
                map(task => TaskActions.loadTaskSuccess({ task })),
                catchError(err => of(TaskActions.loadTaskFailure({ error: err.message })))
            )
        )
    ));

    createTask$ = createEffect(() => this.actions$.pipe(
        ofType(TaskActions.createTask),
        switchMap(({ req }) =>
            this.taskSvc.create(req).pipe(
                map(task => TaskActions.createTaskSuccess({ task })),
                catchError(err => of(TaskActions.createTaskFailure({ error: err.message })))
            )
        )
    ));

    changeStatus$ = createEffect(() => this.actions$.pipe(
        ofType(TaskActions.changeStatus),
        switchMap(({ id, newStatus }) =>
            this.taskSvc.changeStatus(id, newStatus).pipe(
                map(task => TaskActions.changeStatusSuccess({ task })),
                catchError(err => of(TaskActions.changeStatusFailure({ error: err.message })))
            )
        )
    ));

    deleteTask$ = createEffect(() => this.actions$.pipe(
        ofType(TaskActions.deleteTask),
        switchMap(({ id }) =>
            this.taskSvc.delete(id).pipe(
                map(() => TaskActions.deleteTaskSuccess({ id })),
                catchError(err => of(TaskActions.loadTasksFailure({ error: err.message })))
            )
        )
    ));

    // Refresh task when SignalR push received
    refreshOnSignalR$ = createEffect(() => this.actions$.pipe(
        ofType(TaskActions.taskUpdatedViaSignalR),
        map(({ taskId }) => TaskActions.loadTask({ id: taskId }))
    ));

    constructor() { }
}
function createEffect(arg0: () => any) {
    throw new Error("Function not implemented.");
}

function ofType(loadTasks: unknown): any {
    throw new Error("Function not implemented.");
}

