import { Component, Output, EventEmitter, Input, NgModule, OnInit, DoCheck } from '@angular/core';

import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';

import { DataService } from '../../../data/data.service';
import { ChangingTheStateService } from '../../../change/changing-the-state.service';

import { FormsModule } from '@angular/forms';
import { NgOptimizedImage, IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';


@Component({
    selector: 'staff',
    standalone: true,
    imports: [HttpClientModule, FormsModule, NgOptimizedImage],
    providers: [DataService, {
        provide: IMAGE_LOADER,
        useValue: (config: ImageLoaderConfig) => {
            return `http://localhost:3000/icons?icon_name=${config.src}`
        }
    }],
    templateUrl: './staff.component.html',
    styleUrls: ['./staff.component.css', './staff_style_dop.component.css']
})

export class Staff implements OnInit, DoCheck {

    @Input() updateStaff: boolean = false;
    @Output() onClick = new EventEmitter();

    array__employee_facilities: any = [];
    array__structured_data_for_a_table: any = [];

    number__the_sum_of_the_list_pages: number = 0;
    number__current_page: number = 0;
    number__skipping_requests: number = 0;

    string__search_text: any;

    array__page_numbering: any = [];

    constructor(private dataService: DataService, private http: HttpClient, private CHTSS: ChangingTheStateService){
        this.CHTSS.updateComponentStaff.subscribe(() => {
            if (this.number__skipping_requests != 0) {
                this.ngDoCheck();
            }
            this.number__skipping_requests = this.number__skipping_requests + 1;
        });
        
    }

    performingASearchByAGivenValue() {
        let value: number = this.string__search_text;
        let found_people = this.array__employee_facilities.filter((obj: any) => {
            if (obj.fcs.includes(this.string__search_text)) {
                return obj;
            }
            if (isNaN(value*1) == false) {
                if (obj.office == (value*1)) {
                    return obj;
                }
            }
        });
        this.array__employee_facilities = found_people;
    }

    createStructuringTheListOfEmployees(array: any, chunkSize: number): any {
        if (array.length != 0) {
            let res = [];
            for ( let i = 0; i < array.length; i += chunkSize ) {
                let chunk = array.slice(i, i + chunkSize);
                res.push(chunk);
            }
            return res;
        }
    }

    calcTheNumberOfPagesInTheList(split_list: any): number {
        return split_list.length;
    }

    createAnArrayOfNumbers(number_of_pages: number) {
        this.array__page_numbering = Array.from({length: number_of_pages}, (_, i) => i + 1);
    }

    changingTheDisplayedListPage(page_number: number) {
        if (page_number != -1 && page_number >= 0 ) {
            this.number__current_page = page_number
            this.array__employee_facilities = this.array__structured_data_for_a_table[page_number];
        }
    }

    deleteEmployee(employee_index: number) {
        try {
            let xhr = new XMLHttpRequest();
            xhr.open('DELETE', 'http://localhost:3000/staff');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify({
                id: employee_index
            }));
            xhr.onload = () => {
                if (xhr.status == 200) {
                    this.CHTSS.dataAboutTheRemovalOfAnEmployee.next(
                        this.array__employee_facilities[
                            this.array__employee_facilities.indexOf(
                                this.array__employee_facilities.filter((item: any) => item.id == employee_index)[0]
                            )
                        ].fcs
                    );
                }
                this.getDataFromTheServer();
            };
        } catch (error) {
            console.log(error);
        }
    }

    editingEmployeeData(employee_index: number) {
        this.CHTSS.employeeEditingData.next(employee_index);
    }

    getDataFromTheServer() {
        this.http.get('http://localhost:3000/staff', {observe: 'response'}).subscribe(res => {
            this.dataService.changingEmployeeData(res.body);
            this.array__employee_facilities = res.body;
            this.array__structured_data_for_a_table = this.createStructuringTheListOfEmployees(this.array__employee_facilities, 14);
            if ( this.array__structured_data_for_a_table.length != 0 ) {
                this.array__employee_facilities = this.array__structured_data_for_a_table[this.number__current_page];
            }
            this.number__the_sum_of_the_list_pages = this.calcTheNumberOfPagesInTheList(this.array__structured_data_for_a_table);
            this.createAnArrayOfNumbers(this.number__the_sum_of_the_list_pages);
        });
    }

    ngOnInit() {
        this.getDataFromTheServer();
    }

    ngDoCheck() {
        this.getDataFromTheServer();
    }
}