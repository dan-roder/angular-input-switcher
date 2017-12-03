import { ComponentFactoryResolver, Directive, ElementRef, Input, Renderer, Output, EventEmitter, SimpleChange, ViewContainerRef, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { NgbDatepicker, NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { DatepickerComponent } from '../components/datepicker/datepicker.component';
import { Observable } from 'rxjs/Rx';

import * as moment from 'moment';
import * as _ from 'lodash';

@Directive({
  selector: '[safartiInputSwitcher]',
  exportAs: 'InputSwitcherDirective'
})
export class InputSwitcherDirective implements OnChanges {
  @Input() edit: boolean;
  @Input() type = 'text';
  @Input() subsetKey: string;
  @Input() id = '';
  @Output() valueOutput: EventEmitter<any> = new EventEmitter();
  private nativeElement: Node;
  private previousValue: string;
  private currentValue: string;
  private elementName: string;
  private model;
  private component;

  constructor(public el: ElementRef, public renderer: Renderer, private vc: ViewContainerRef, private resolver: ComponentFactoryResolver) {
    this.previousValue = el.nativeElement.textContent;
  }

  handleChange(value, firstChange) {
    // Ensure this isn't the first time the variable was set
    if (!firstChange) {
      if (value === 'true') {
        this.editMode();
      }
      else if (value === 'saved') {
        this.newValues();
      }
      else {
        this.el.nativeElement.textContent = this.previousValue;
      }
    }
  }

  ngOnChanges(changes: { [propName: string]: SimpleChange }) {
    // if the datepicker is on, will remove the datepicker when edit is closed ( or else the datepicker just hangs around after the edit is closed )
    if (this.component) {
      this.component.destroy();
    }
    this.handleChange(changes['edit'].currentValue, changes['edit'].isFirstChange());

  }


  editMode() {
    // Store current value
    this.currentValue = _.trim(this.el.nativeElement.textContent);
    // Set previousValue to current value
    this.previousValue = this.currentValue;
    // Wipe out text node
    this.el.nativeElement.textContent = '';

    //Create and render element

    switch (this.type) {
      case 'text':
        this.generateElement('input', { 'value': this.currentValue, 'name': this.el.nativeElement.getAttribute('name'), 'type': 'text' });
        break;

      case 'ta':
        this.generateTextarea({ 'value': this.currentValue, 'name': this.el.nativeElement.getAttribute('name') });
        break;

      case 'datepicker':
        this.generateDatepicker({ 'value': this.el.nativeElement.getAttribute('data-value'), 'name': this.el.nativeElement.getAttribute('name'), 'type': 'hidden', 'parent': this.el.nativeElement });
        break;

      case 'select':
        this.generateSelectBox({ 'name': this.el.nativeElement.getAttribute('name'), 'ele': this.el });
        break;

      default:
        this.generateElement('input', { 'value': this.currentValue, 'name': this.el.nativeElement.getAttribute('name'), 'type': 'text' });
        break;

    }
  }

  generateElement(type, attrs) {
    let inputElement = this.renderer.createElement(this.el.nativeElement, type);
    this.renderer.setElementAttribute(inputElement, 'type', 'text');
    this.renderer.setElementAttribute(inputElement, 'value', _.trim(attrs.value));
    this.renderer.setElementAttribute(inputElement, 'name', attrs.name);
    this.elementName = attrs.name;
    this.renderer.listen(inputElement, 'change', (event) => {
      this.currentValue = event.target.value;
      this.valueOutput.emit(this.currentValue);
    });
  }

  generateTextarea(attrs) {
    let ele = this.renderer.createElement(this.el.nativeElement, 'textarea');
    this.renderer.createText(ele, _.trim(attrs.value));
    this.renderer.setElementAttribute(ele, 'name', attrs.name);
    this.renderer.setElementAttribute(ele, 'rows', '6');
    this.elementName = attrs.name;
    this.renderer.listen(ele, 'change', (event) => {
      this.currentValue = event.target.value;
      this.valueOutput.emit(this.currentValue)
    });
  }
  // add attrs.values
  generateSelectBox(attrs) {

    const name = attrs.name;
    const rend = this.renderer;
    const curValue = this.currentValue;
    const opts = attrs.ele.nativeElement.getAttribute('options');
    const values = attrs.ele.nativeElement.getAttribute('values');
    var arr = opts.split('/');
    let options;
    if (values) {
      const valuesSplit = values.split('/');
      options = _.zipWith(arr, valuesSplit, function(opt, val) {
        return { option: opt, value: val };
      });
    } else {
      options = opts.split('/');
    }

    const select = this.renderer.createElement(this.el.nativeElement, 'select');
    this.renderer.setElementAttribute(select, 'name', attrs.name);
    this.elementName = attrs.name;

    _.forEach(options, function (value, key) {
      const readableValue = typeof value === 'object' ? value.option : value;
      const writableValue = typeof value === 'object' ? value.value : value;
      const option = rend.createElement(select, 'option');
      rend.setElementAttribute(option, 'value', writableValue);
      rend.createText(option, readableValue);
      if (writableValue == curValue) {
        rend.setElementAttribute(option, 'selected', 'selected');
      }
    });

    this.renderer.listen(select, 'change', (event) => {
      this.currentValue = event.target.value;
      this.valueOutput.emit(this.currentValue);
    })
  }


  generateDatepicker(attrs) {
    let datePicker = this.resolver.resolveComponentFactory(DatepickerComponent);
    let initDate = moment(attrs.value, ["x", "yyyy-mm-dd", "mm/dd/yyyy"]);
    this.component = this.vc.createComponent(datePicker);
    this.component.changeDetectorRef.detectChanges();
    // Initializing Datepicker component with the input value;
    this.component.instance.model = { year: initDate.year(), month: initDate.month() + 1, day: initDate.date() };
    this.elementName = attrs.name;
    this.type = 'datepicker';
    this.currentValue = attrs.value;
    this.component.instance.change.subscribe(date => {
      this.currentValue = date;
      this.valueOutput.emit(this.currentValue);
    });
  }

  newValues() {
    // Taking value from input/datepicker/select and placing in on the page as text
    this.el.nativeElement.textContent = this.currentValue;
  }

}
