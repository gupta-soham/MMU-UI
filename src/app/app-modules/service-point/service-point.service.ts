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

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable()
export class ServicePointService {
  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  getServicePoints(userId: string, serviceProviderId: string) {
    return this.http.post(environment.servicePointUrl, {
      userID: userId,
      providerServiceMapID: serviceProviderId,
    });
  }

  getMMUDemographics() {
    const spID = localStorage.getItem('servicePointID');
    const spPSMID = localStorage.getItem('providerServiceID');
    const userId = localStorage.getItem('userID');

    return this.http.post(environment.demographicsCurrentMasterUrl, {
      spID: spID,
      spPSMID: spPSMID,
      userId: userId,
    });
  }
}
