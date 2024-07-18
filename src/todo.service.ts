import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable, computed, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Observable, Subject, catchError, delay, map, tap, of, switchMap } from "rxjs";
import { User, UserService } from "./user.service";
import { setErrorMessage } from "./utility/errorHandling";

@Injectable({
   providedIn: 'root'
})
export class TodoService {
   todoUrl = 'https://jsonplaceholder.typicode.com/todos';

   // Services
   private http = inject(HttpClient);
   private userService = inject(UserService);

   private state = signal<TodoState>({
      isLoading: false,
      currentMember: undefined,
      memberTodos: [],
      error: '',
      incompleteOnly: false
   });

   isLoading = computed(() => this.state().isLoading);
   currentMember = computed(() => this.state().currentMember);
   private todos = computed(() => this.state().memberTodos);
   errorMessage = computed(() => this.state().error);
   incompleteOnly = computed(() => this.state().incompleteOnly);

   filteredTodos = computed(() => {
      if (this.incompleteOnly()) {
         return this.todos().filter(t => t.completed === false);
      }
      else {
         return this.todos();
      }
   });

   private selectedIdSubject = new Subject<number>();

   constructor() {
      this.selectedIdSubject.pipe(
         tap(() => this.setLoadingIndicator(true)),
         tap(id => this.setCurrentMember(id)),
         switchMap(id => this.getTodos(id)),
         delay(1000),
         tap(() => this.setLoadingIndicator(false)),
         tap(todos => this.setTodos(todos)),
         takeUntilDestroyed()
      ).subscribe();
   }

   setMemberId(memberId: number) {
      this.selectedIdSubject.next(memberId);
   }

   setIncompleteOnly(filter: boolean) {
      this.state.update(state => ({
         ...state,
         incompleteOnly: filter
      }));
   }

   changeStatus(task: Todo, status: boolean) {
      // Mark the task as completed
      const updatedTasks = this.todos().map(t =>
         t.id === task.id ? { ...t, completed: status } : t);
      this.state.update(state => ({
         ...state,
         memberTodos: updatedTasks
      }));
   }

   private saveChanges(todo: Todo): Observable<Todo> {
      return this.http.put<Todo>(`${this.todoUrl}/${todo.id}`, todo).pipe(
        catchError(err => {
          this.state.update(state => ({
            ...state,
            error: setErrorMessage(err)
          }))
          return of(todo);
      }));
    }
 
   private setLoadingIndicator(isLoading: boolean) {
      this.state.update(state => ({
         ...state,
         isLoading: isLoading
      }))
   }

   private setCurrentMember(id: number) {
      const member = this.userService.getCurrentMember(id);
      this.state.update(state => ({
         ...state,
         currentMember: member,
         memberTodos: []
      }));
   }

   private getTodos(id: number): Observable<Todo[]> {
      return this.http.get<Todo[]>(`${this.todoUrl}?userId=${id}`).pipe(
         // Cut the length of the long strings
         map(data => data.map(t =>
            t.title.length > 20 ? ({ ...t, title: t.title.substring(0, 20) }) : t
         )),
         catchError(err => this.setError(err))
      )
   }

   private setError(err: HttpErrorResponse): Observable<Todo[]> {
      this.state.update(state => ({
         ...state,
         error: setErrorMessage(err)
      }))
      return of([]);
   }

   private setTodos(todos: Todo[]) {
      this.state.update(state => ({
         ...state,
         memberTodos: todos
      }));
   }


}

export interface Todo {
   userId: number;
   id: number;
   title: string;
   completed: boolean;
}

export interface TodoState {
   isLoading: boolean;
   currentMember: User | undefined;
   memberTodos: Todo[];
   error: string;
   incompleteOnly: boolean;
}