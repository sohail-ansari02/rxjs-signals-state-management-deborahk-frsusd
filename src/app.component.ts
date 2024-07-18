import { Component, inject, signal } from '@angular/core';
import { Todo, TodoService } from './todo.service';
import { User, UserService } from './user.service';
import { NgClass } from '@angular/common';

@Component({
   selector: 'app-root',
   standalone: true,
   imports: [NgClass],
   templateUrl: 'app.component.html'
})
export class App {
   pageTitle = 'Todo List';

   // Services
   userService = inject(UserService);
   todoService = inject(TodoService);

   // User Signals  
   members = this.userService.members;

   // Todo Signals
   isLoading = this.todoService.isLoading;
   selectedMember = this.todoService.currentMember;
   todosForMember = this.todoService.filteredTodos;
   errorMessage = this.todoService.errorMessage;
   incompleteOnly = signal(false);

   // Actions
   onSelected(ele: EventTarget | null) {
      const id = Number((ele as HTMLSelectElement).value);
      this.todoService.setMemberId(id);
   }

   onFilter(ele: EventTarget | null) {
      const filter = (ele as HTMLInputElement).checked;
      this.todoService.setIncompleteOnly(filter);
   }

   onChangeStatus(task: Todo, ele: EventTarget | null) {
      const checked = (ele as HTMLInputElement).checked;
      this.todoService.changeStatus(task, checked);      
   }

}
