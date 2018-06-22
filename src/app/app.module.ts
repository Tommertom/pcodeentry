import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { HomePage } from '../pages/home/home';


import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { HttpModule } from "@angular/http";

import { IonicStorageModule } from '@ionic/storage';

import { Injectable } from '@angular/core';

import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class MyErrorsHandler implements ErrorHandler {
  handleError(error: Error | HttpErrorResponse) {
    // Do whatever you like with the error (send it to the server?)
    // And log it to the console
    console.error('It happens: ', error);

    if (error instanceof HttpErrorResponse) {
      // Server or connection error happened
      if (!navigator.onLine) {
        // Handle offline error
      } else {
        // Handle Http Error (error.status === 403, 404...)
        console.error('It happens HTTP: ', error);
      }
    } else {
      // Handle Client Error (Angular Error, ReferenceError...)     
    }
  }
}

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    BrowserModule, HttpModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: ErrorHandler, useClass: MyErrorsHandler } //IonicErrorHandler}
  ]
})
export class AppModule { }
