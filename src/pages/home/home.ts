import { Component } from '@angular/core';
import { NavController, AlertController, ToastController } from 'ionic-angular';

import { Storage } from '@ionic/storage';
import { Http, Headers, RequestOptions } from "@angular/http";
import 'rxjs/add/operator/map';

import * as Clipboard from 'clipboard/dist/clipboard.min.js';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  apiKey: string = "";
  txtToCopy: string = "";
  cards: Array<Object> = [];
  clipboard: any;
  constructor(public toastCtrl: ToastController, private alertCtrl: AlertController, public navCtrl: NavController, private storage: Storage, private http: Http) {
    this.getStuff();
  }

  ionViewDidEnter() {
    this.clipboard = new Clipboard('#cpyBtn');
    this.clipboard.on('success', () => { this.showMsg('Clipboard copied') });
  }

  showMsg(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      duration: 3000,
      position: 'top'
    });
    toast.present();
  }



  exportCards() {
    let quote = '"';

    function csvCell(txt) {
      return '"' + txt + '",';
    }

    this.txtToCopy = "";
    this.cards.map(card => {

      if (card['plaats'] != "")
        this.txtToCopy +=
          csvCell(card['initialen']) +
          csvCell(card['voornaam']) +
          csvCell(card['tussen']) +
          csvCell(card['achternaam']) +
          csvCell(card['straatnaam']) +
          csvCell(card['huisnummer']) +
          csvCell(card['postcode']) +
          csvCell(card['plaats']) +
          csvCell(card['email']) +
          quote + card['telnr'] + quote + "\n";
    })
  }

  voornaamChange(voornaam, card) {
    card.initialen = voornaam.charAt(0) + '.';
  }

  telNrCheck(card) {
    let telnr = card['telnr'];
    if (telnr.substring(0, 2) == "06")
      if (telnr.charAt(2) != '-')
        card['telnr'] = '06' + '-' + telnr.slice(-8)
  }


  clearCards() {
    let confirm = this.alertCtrl.create({
      title: 'Clear cards',
      message: 'U sure?',
      buttons: [
        {
          text: 'Disagree',
          handler: () => {
            console.log('Disagree clicked');
          }
        },
        {
          text: 'Agree',
          handler: () => {
            console.log('Agree clicked');
            this.cards = [];
            this.addHundred();
            this.saveStuff();
          }
        }
      ]
    });
    confirm.present()
  }


  emailComplete(card, event) {
   // console.log('stuff', card);

    let emails = [
      { e: '@gma', d: '@gmail.com' },
      { e: '@hetn', d: '@hetnet.nl' }
      { e: '@hotm', d: '@hotmail.com' },
      { e: '@qui', d: '@quicknet.nl' },
      { e: '@liv', d: '@live.nl' },
      { e: '@outl', d: '@outook.com' }
    ]

    emails.map(entry => {
      let e = entry['e'];
      let d = entry['d'];
      let teste = card['email'].slice(-1 * e.length);
      //console.log('check s ',e,d,teste)

      if (teste == e) {
       // console.log('HITT')
        card['email']=card['email'].replace(e, d);
      }
    })

  }

  postcodeCheck(card) {

    let headers = new Headers({ 'X-Api-Key': this.apiKey });
    let postcode = card['postcode'].replace(/ /g, '').toUpperCase();
    let number = card['huisnummer']
    let url = "https://api.postcodeapi.nu/v2/addresses/?postcode=" + postcode + "&number=" + number;

    this.http.get(url, new RequestOptions({ headers: headers }))
      .map(res => res.json())
      .map(res => res['_embedded'])
      .map(res => res['addresses'][0])
      .subscribe(data => {
        let city = data['city']['label'];
        let street = data['street']
        card['straatnaam'] = street;
        card['plaats'] = city;
        console.log('DATA', data)
      }, (err) => {
        console.log('GAAT NIET WERKEN',err);
        this.showMsg('Error search postcode ')
      })

    // and clean postcode
    card['postcode'] = postcode.substring(0, 4) + ' ' + postcode.slice(-2);
  }


  saveStuff() {
    this.storage.set('stuff', this.cards);
    console.log('Saved');
  }

  setApiKey() {
    if (this.apiKey.length > 0) {
      console.log('Saving api key', this.apiKey)
      this.storage.set('apiKey', this.apiKey)
    }
  }

  getStuff() {

    this.storage.get('apiKey').then((val) => {
      if (val) {
        this.apiKey = val;

        console.log('Found api key', this.apiKey)
      }

    });

    this.storage.get('stuff').then((val) => {
      if (val) this.cards = val;
      this.addHundred();
    });
  }

  addHundred() {

    while (this.cards.length < 100) {
      this.cards.push({
        voornaam: "",
        tussen: "",
        achternaam: "",
        initialen: "",
        postcode: "",
        huisnummer: "",
        email: "",
        telnr: "",
        straatnaam: "",
        plaats: ""
      })
    }
  }

}
