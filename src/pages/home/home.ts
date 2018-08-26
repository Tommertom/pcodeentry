import { Observable } from 'rxjs/Observable';
import { Component } from '@angular/core';
import { NavController, AlertController, ToastController } from 'ionic-angular';

import { Storage } from '@ionic/storage';
import { Http, Headers, RequestOptions } from "@angular/http";
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import * as Clipboard from 'clipboard/dist/clipboard.min.js';

interface entryLine {
  voornaam: string;
  tussen: string;
  achternaam: string;
  initialen: string;
  postcode: string;
  huisnummer: string;
  email: string;
  telnr: string;
  straatnaam: string;
  geslacht: string;
  plaats: string;
}

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  apiKey: string = "";
  txtToCopy: string = "";
  cards: Array<entryLine> = [];
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

      if (card.plaats != "") {

        if (typeof card.geslacht == 'undefined') card.geslacht = "";

        this.txtToCopy +=
          csvCell(card.voornaam) +
          csvCell(card.initialen) +
          csvCell(card.tussen) +
          csvCell(card.achternaam) +
          csvCell(card.geslacht) +
          csvCell(card.straatnaam) +
          csvCell(card.huisnummer) +
          csvCell(card.postcode) +
          csvCell(card.plaats) +
          csvCell(card.email) +
          quote + card.telnr + quote + "\n";
      }
    })
  }

  voornaamChange(voornaam, card) {
    if (voornaam.length > 0) {
      card.initialen = voornaam.charAt(0) + '.';
      card.geslacht = 'm';
      card.initialen = card.initialen.toUpperCase();
    }
  }

  initialenCheck(card) {
    card.initialen = card.initialen.toUpperCase();
    if (card.initialen.length == 1) card.initialen += '.';
  }

  telNrEntry(card) {
    if (card.telnr == '') card.telnr = '06-';
  }

  telNrCheck(card) {
    if (card.telnr == '06-') card.telnr = '';

    if (card.telnr.substring(0, 4) == '06-0')
      card.telnr = card.telnr.substring(3, 1000);

    let telnr = card.telnr;
    if (telnr.substring(0, 2) == "06")
      if (telnr.charAt(2) != '-')
        card.telnr = '06' + '-' + telnr.slice(-8)
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
            this.txtToCopy = "";
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

    interface emailMatch {
      e: string;
      d: string;
    }

    let emails: Array<emailMatch> = [
      { e: '@gma', d: '@gmail.com' },
      { e: '@hom', d: '@home.nl' },
      { e: '@zig', d: '@ziggo.nl' },
      { e: '@hetn', d: '@hetnet.nl' },
      { e: '@hotm', d: '@hotmail.com' },
      { e: '@quic', d: '@quicknet.nl' },
      { e: '@liv', d: '@live.nl' },
      { e: '@cai', d: '@caiway.nl' },
      { e: '@kpn', d: '@kpnplanet.nl' },
      { e: '@upc', d: '@upcmail.nl' },
      { e: '@outl', d: '@outook.com' }
    ]

    emails.map(entry => {
      let e = entry.e;
      let d = entry.d;
      let teste = card.email.slice(-1 * e.length);
      //console.log('check s ',e,d,teste)

      if (teste == e) {
        // console.log('HITT')
        card.email = card.email.replace(e, d);
      }
    })

  }

  plaatsEntry(card, i) {
    if (card.plaats == '' && i > 0)
      card.plaats = this.cards[i-1].plaats
  }

  postcodeCheck(card) {

    let headers = new Headers({ 'X-Api-Key': this.apiKey });
    let postcode = card.postcode.replace(/ /g, '').toUpperCase();
    let number = card.huisnummer
    let url = "https://api.postcodeapi.nu/v2/addresses/?postcode=" + postcode + "&number=" + number;

    if (postcode.length==6 && postcode != "" && card.plaats == "")
      this.http.get(url, new RequestOptions({ headers: headers }))
        .map(res => res.json())
        .map(res => res['_embedded'])
        .map(res => res['addresses'][0])
        .subscribe(data => {
          let city = data['city']['label'];
          let street = data['street']
          card.straatnaam = street;
          card.plaats = city;
          console.log('data ', data)
        }, (err) => {
          this.showMsg('Error search postcode ');
          console.log('Error ', err)
        })

    // and clean postcode
    card.postcode = postcode; //.substring(0, 4) + postcode.slice(-2);
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
        geslacht: "",
        plaats: ""
      })
    }
  }

}
