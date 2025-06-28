import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-field-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './field-selector.html',
  styleUrl: './field-selector.css'
})
export class FieldSelector {
  // Input signals for available and initially selected fields
  availableFields = input<string[]>([]);
  initialSelection = input<string[]>([]); // To remember the state for reset
  selectedFields = input.required<string[]>();

  // Output event emitter for when the selection changes
  selectedFieldsChange = output<string[]>();

  // Signal for the search term
  searchTerm = signal('');

  // Internal set for efficient checking of selected fields
  private selectedSet = computed(() => new Set(this.selectedFields()));

  // Computed property to get the currently selected fields
  selectedFieldsAsListText = computed(() => {
    const selected = this.selectedFields();
    if (selected.length === 0) {
      return 'No fields selected';
    }
    return selected.join(', ');
  });

  // Filtered fields based on the search term
  filteredFields = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.availableFields();
    }
    return this.availableFields().filter(field => field.toLowerCase().includes(term));
  });

  // Check if a specific field is selected
  isSelected(field: string): boolean {
    return this.selectedSet().has(field);
  }

  // Computed property to check if all *filtered* fields are selected
  allFilteredSelected = computed(() => {
      const filtered = this.filteredFields();
      if(filtered.length === 0) return false;
      return filtered.every(field => this.isSelected(field));
  });

  // Computed property to check if no fields are selected
  noneSelected = computed(() => this.selectedFields().length === 0);

  /**
   * Handles the search input change event.
   * @param event The DOM event from the input.
   */
  onSearchChange(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  /**
   * Handles the change event when a checkbox is toggled.
   * @param event The DOM event from the checkbox.
   * @param field The field associated with the checkbox.
   */
  onFieldChange(event: Event, field: string) {
    const checked = (event.target as HTMLInputElement).checked;
    const currentSelection = new Set(this.selectedFields());

    if (checked) {
      currentSelection.add(field);
    } else {
      currentSelection.delete(field);
    }
    this.selectedFieldsChange.emit(Array.from(currentSelection));
  }

  /**
   * Selects all currently visible (filtered) fields.
   */
  selectAll() {
    const currentSelection = new Set(this.selectedFields());
    this.filteredFields().forEach(field => currentSelection.add(field));
    this.selectedFieldsChange.emit(Array.from(currentSelection));
  }

  /**
   * Unselects all fields.
   */
  unselectAll() {
    this.selectedFieldsChange.emit([]);
  }

  /**
   * Resets the selection to the initial state and clears search.
   */
  reset() {
    this.searchTerm.set('');
    this.selectedFieldsChange.emit([...this.initialSelection()]);
  }
}
