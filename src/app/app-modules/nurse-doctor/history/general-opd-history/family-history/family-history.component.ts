/*
 * AMRIT – Accessible Medical Records via Integrated Technology
 * Integrated EHR (Electronic Health Records) Solution
 *
 * Copyright (C) "Piramal Swasthya Management and Research Institute"
 *
 * This file is part of AMRIT.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
 */

import { Component, OnInit, Input, DoCheck, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormArray,
  FormGroup,
  AbstractControl,
} from '@angular/forms';

import { PreviousDetailsComponent } from '../../../../core/components/previous-details/previous-details.component';
import {
  MasterdataService,
  NurseService,
  DoctorService,
} from '../../../shared/services';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { MatDialog } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';

@Component({
  selector: 'app-general-family-history',
  templateUrl: './family-history.component.html',
  styleUrls: ['./family-history.component.css'],
})
export class FamilyHistoryComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  familyHistoryForm!: FormGroup;

  @Input()
  mode!: string;

  @Input()
  visitCategory: any;

  masterData: any;
  familyHistoryData: any;

  diseaseMasterData: any = [];
  familyMemeberMasterData: any = [];
  previousSelectedDiseaseList: any = [];
  diseaseSelectList: any = [];
  currentLanguageSet: any;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    private masterdataService: MasterdataService,
    public httpServiceService: HttpServiceService
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getMasterData();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();

    if (this.generalHistorySubscription)
      this.generalHistorySubscription.unsubscribe();
  }

  getFamilyDiseases(): AbstractControl[] | null {
    const familyDiseaseControl =
      this.familyHistoryForm.get('familyDiseaseList');
    return familyDiseaseControl instanceof FormArray
      ? familyDiseaseControl.controls
      : null;
  }

  nurseMasterDataSubscription: any;
  getMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe(masterData => {
        if (masterData) {
          this.masterData = masterData;
          this.diseaseMasterData = masterData.DiseaseTypes;
          this.familyMemeberMasterData = masterData.familyMemberTypes;
          this.addFamilyDisease();

          if (this.mode == 'view') {
            const visitID = localStorage.getItem('visitID');
            const benRegID = localStorage.getItem('beneficiaryRegID');
            this.getGeneralHistory(benRegID, visitID);
          }
        }
      });
  }

  generalHistorySubscription: any;
  getGeneralHistory(benRegID: any, visitID: any) {
    this.generalHistorySubscription = this.doctorService
      .getGeneralHistoryDetails(benRegID, visitID)
      .subscribe((history: any) => {
        if (
          history != null &&
          history.statusCode == 200 &&
          history.data != null &&
          history.data.FamilyHistory
        ) {
          this.familyHistoryData = history.data.FamilyHistory;
          this.handleFamilyHistoryData();
        }
      });
  }

  handleFamilyHistoryData() {
    this.familyHistoryForm.patchValue({
      familyDiseaseList: this.familyHistoryData.familyDiseaseList,
    });
    const formArray = this.familyHistoryForm.controls[
      'familyDiseaseList'
    ] as FormArray;
    const temp = this.familyHistoryData.familyDiseaseList.slice();

    for (let i = 0; i < temp.length; i++) {
      const diseaseType = this.diseaseMasterData.filter((item: any) => {
        return item.diseaseType == temp[i].diseaseType;
      });

      if (diseaseType.length > 0) temp[i].diseaseType = diseaseType[0];

      if (temp[i].diseaseType) {
        const k: any = formArray.get('' + i);
        k.patchValue(temp[i]);
        k.markAsTouched();
        this.filterFamilyDiseaseList(temp[i].diseaseType, i);
      }

      if (i + 1 < temp.length) this.addFamilyDisease();
    }
  }

  addFamilyDisease() {
    const familyDiseaseList = <FormArray>(
      this.familyHistoryForm.controls['familyDiseaseList']
    );
    const temp = familyDiseaseList.value;

    if (this.diseaseMasterData) {
      const result = this.diseaseMasterData.filter((item: any) => {
        const arr = temp.filter((value: any) => {
          if (
            value.diseaseType != null &&
            value.diseaseType.diseaseType != 'Other'
          )
            return value.diseaseType.diseaseType == item.diseaseType;
          else return false;
        });
        if (item.diseaseType == 'None' && temp.length > 0) return false;
        else if (arr.length == 0) return true;
        else return false;
      });
      this.diseaseSelectList.push(result.slice());
    }
    familyDiseaseList.push(this.initFamilyDiseaseList());
  }

  filterFamilyDiseaseList(
    event: any,
    i: any,
    familyDiseaseForm?: AbstractControl<any, any>
  ) {
    const disease: any = event.value;
    const previousValue: any = this.previousSelectedDiseaseList[i];
    if (disease.diseaseType == 'None') {
      this.removeFamilyDiseaseExecptNone();
    }

    if (familyDiseaseForm && disease.diseaseType != 'Other')
      familyDiseaseForm.patchValue({
        otherDiseaseType: null,
        snomedCode: disease.snomedCode,
        snomedTerm: disease.snomedTerm,
      });

    if (previousValue) {
      this.diseaseSelectList.map((item: any, t: any) => {
        if (t != i && previousValue.diseaseType != 'Other') {
          item.push(previousValue);
          this.sortDiseaseList(item);
        }
      });
    }

    this.diseaseSelectList.map((item: any, t: any) => {
      const index = item.indexOf(disease);
      if (index != -1 && t != i && disease.diseaseType != 'Other')
        item = item.splice(index, 1);
    });

    this.previousSelectedDiseaseList[i] = disease;
  }

  removeFamilyDiseaseExecptNone() {
    const familyDiseaseList = <FormArray>(
      this.familyHistoryForm.controls['familyDiseaseList']
    );
    while (familyDiseaseList.length > 1) {
      const i = familyDiseaseList.length - 1;

      const removedValue = this.previousSelectedDiseaseList[i];
      if (removedValue) this.diseaseSelectList[0].push(removedValue);

      this.sortDiseaseList(this.diseaseSelectList[0]);
      familyDiseaseList.removeAt(i);
      this.previousSelectedDiseaseList.splice(i, 1);
      this.diseaseSelectList.splice(i, 1);
    }
  }

  removeFamilyDisease(i: any, familyHistoryForm?: AbstractControl<any, any>) {
    this.confirmationService
      .confirm(`warn`, this.currentLanguageSet.alerts.info.warn)
      .subscribe(result => {
        if (result) {
          const familyDiseaseList = <FormArray>(
            this.familyHistoryForm.controls['familyDiseaseList']
          );
          this.familyHistoryForm.markAsDirty();
          if (!!familyHistoryForm && familyDiseaseList.length == 1) {
            familyHistoryForm.reset();
          } else {
            const removedValue = this.previousSelectedDiseaseList[i];
            this.diseaseSelectList.map((item: any, t: any) => {
              if (
                t != i &&
                removedValue &&
                removedValue.diseaseType != 'Other'
              ) {
                item.push(removedValue);
                this.sortDiseaseList(item);
              }
            });
            this.previousSelectedDiseaseList.splice(i, 1);
            this.diseaseSelectList.splice(i, 1);
            familyDiseaseList.removeAt(i);
          }
        }
      });
  }

  getPreviousFamilyHistory() {
    const benRegID: any = localStorage.getItem('beneficiaryRegID');
    this.nurseService
      .getPreviousFamilyHistory(benRegID, this.visitCategory)
      .subscribe(
        (res: any) => {
          if (res.statusCode == 200 && res.data != null) {
            if (res.data.data.length > 0) {
              this.viewPreviousData(res.data);
            } else {
              this.confirmationService.alert(
                this.currentLanguageSet.historyData.ancHistory
                  .previousHistoryDetails.pastHistoryalert
              );
            }
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.alerts.info.errorFetchingHistory,
              'error'
            );
          }
        },
        err => {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.errorFetchingHistory,
            'error'
          );
        }
      );
  }

  viewPreviousData(data: any) {
    this.dialog.open(PreviousDetailsComponent, {
      data: {
        dataList: data,
        title:
          this.currentLanguageSet.historyData.familyhistory
            .previousfamilyhistory,
      },
    });
  }

  initFamilyDiseaseList() {
    return this.fb.group({
      diseaseTypeID: null,
      diseaseType: null,
      otherDiseaseType: null,
      familyMembers: null,
      snomedCode: null,
      snomedTerm: null,
    });
  }

  get isGeneticDisorder() {
    return this.familyHistoryForm.controls['isGeneticDisorder'].value;
  }

  resetOtherGeneticOrder() {
    this.familyHistoryForm.patchValue({ geneticDisorder: null });
  }

  sortDiseaseList(diseaseList: any) {
    diseaseList.sort((a: any, b: any) => {
      if (a.diseaseType == b.diseaseType) return 0;
      if (a.diseaseType < b.diseaseType) return -1;
      else return 1;
    });
  }

  checkValidity(diseaseForm: any) {
    const temp = diseaseForm.value;
    if (temp.diseaseType && temp.familyMembers) {
      return false;
    } else {
      return true;
    }
  }
}
