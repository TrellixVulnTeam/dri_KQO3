/*
# L.Catalog contains specific catalog settings and conversion tools.
#
#	This file part of:       VisiOmatic
#
#	Copyright: (C) 2014-2017 Emmanuel Bertin - IAP/CNRS/UPMC,
#	                         Chiara Marmo - IDES/Paris-Sud
#
#	Last modified: 08/12/2017
*/

L.Catalog = {
	nmax: 10000,	// Sets the maximum number of sources per query

	_csvToGeoJSON: function (str) {
		// Check to see if the delimiter is defined. If not, then default to comma.
		var badreg = new RegExp('#|--|objName|string|^$'),
		 lines = str.split('\n'),
		 geo = {type: 'FeatureCollection', features: []};

		for (var i in lines) {
			var line = lines[i];
			if (badreg.test(line) === false) {
				var feature = {
					type: 'Feature',
					id: '',
					properties: {
						items: []
					},
					geometry: {
						type: 'Point',
						coordinates: [0.0, 0.0]
					}
				},
				geometry = feature.geometry,
				properties = feature.properties;

				var cell = line.split(/[,;\t]/);
				feature.id = cell[0];
				geometry.coordinates[0] = parseFloat(cell[1]);
				geometry.coordinates[1] = parseFloat(cell[2]);
				var items = cell.slice(3),
				    item;
				for (var j in items) {
					properties.items.push(this.readProperty(items[j]));
				}
				geo.features.push(feature);
			}
		}
		return geo;
	},

	readProperty: function (item) {
		var	fitem = parseFloat(item);
		return isNaN(fitem) ? '--' : fitem;
	},

	toGeoJSON: function (str) {
		return this._csvToGeoJSON(str);
	},

	popup: function (feature) {
		var str = '<div>';
		if (this.objurl) {
			str += 'ID: <a href=\"' +  L.Util.template(this.objurl, L.extend({
				ra: feature.geometry.coordinates[0].toFixed(6),
				dec: feature.geometry.coordinates[1].toFixed(6)
			})) + '\" target=\"_blank\">' + feature.id + '</a></div>';
		} else {
			str += 'ID: ' + feature.id + '</div>';
		}
		str += '<TABLE style="margin:auto;">' +
		       '<TBODY style="vertical-align:top;text-align:left;">';
		for (var i in this.properties) {
			if (this.propertyMask === undefined || this.propertyMask[i] === true) {
				str += '<TR><TD>' + this.properties[i] + ':</TD>' +
				       '<TD>' + feature.properties.items[i].toString() + ' ';
				if (this.units[i]) {
					str += this.units[i];
				}
				str += '</TD></TR>';
			}
		}
		str += '</TBODY></TABLE>';
		return str;

	},

	draw: function (feature, latlng) {
		var refmag = feature.properties.items[this.magindex ? this.magindex : 0];
		return L.circleMarker(latlng, {
			radius: refmag ? this.maglim + 5 - refmag : 8
		});
	},

	filter: function (feature) {
		return true;
	},

	vizierURL: 'https://vizier.unistra.fr/viz-bin',
	mastURL: 'https://archive.stsci.edu'

};

L.Catalog['2MASS'] = L.extend({}, L.Catalog, {
	service: 'Vizier@CDS',
	name: '2MASS',
	className: 'logo-catalog-vizier',
	attribution: '2MASS All-Sky Catalog of Point Sources (Cutri et al. 2003)',
	color: 'red',
	maglim: 17.0,
	regionType: 'box',
	url: L.Catalog.vizierURL + '/asu-tsv?&-mime=csv&-source=II/246&' +
	 '-out=2MASS,RAJ2000,DEJ2000,Jmag,Hmag,Kmag&-out.meta=&' +
	 '-c.eq={sys}&-c={lng},{lat}&-c.bd={dlng},{dlat}&' +
	 '-out.max={nmax}&-sort=Jmag',
	properties: ['J', 'H', 'K'],
	units: ['', '', ''],
	objurl: L.Catalog.vizierURL + '/VizieR-5?-source=II/246&-c={ra},{dec},eq=J2000&-c.rs=0.01'
});

L.Catalog['2MASS6X'] = L.extend({}, L.Catalog, {
	service: 'Vizier@CDS',
	name: '2MASS 6X',
	className: 'logo-catalog-vizier',
	attribution: '2MASS 6X Point Source Working Database / Catalog (Cutri+ 2006)',
	color: 'red',
	maglim: 24.0,
	regionType: 'box',
	url: L.Catalog.vizierURL + '/asu-tsv?&-mime=csv&-source=II/281/2mass6x&' +
	 '-out=2MASS,RAJ2000,DEJ2000,Jmag,e_Jmag,Hmag,e_Hmag,Kmag,e_Kmag,Bmag,Rmag&-out.meta=&' +
	 '-c.eq={sys}&-c={lng},{lat}&-c.bd={dlng},{dlat}&' +
	 '-out.max={nmax}&-sort=Jmag',
	properties: ['', '', '', '', '', '', '', ''],
	units: ['', '', '', '', '', '', '', ''],
	objurl: L.Catalog.vizierURL + '/VizieR-5?-source=II/281/2mass6x&-c={ra},{dec},eq=J2000&-c.rs=0.01'
});

L.Catalog.SDSS9 = L.extend({}, L.Catalog, {
	service: 'Vizier@CDS',
	name: 'SDSS Release 9',
	className: 'logo-catalog-vizier',
	attribution: 'SDSS Photometric Catalog, Release 9 (Adelman-McCarthy+, 2012)',
	color: 'yellow',
	maglim: 25.0,
	regionType: 'box',
	url: L.Catalog.vizierURL + '/asu-tsv?&-mime=csv&-source=V/139&' +
	 '-out=SDSS9,RA_ICRS,DE_ICRS,umag,gmag,rmag,imag,zmag&-out.meta=&' +
	 '-c.eq={sys}&-c={lng},{lat}&-c.bd={dlng},{dlat}&-out.max={nmax}&-sort=rmag',
	properties: ['u', 'g', 'r', 'i', 'z'],
	units: ['', '', '', '', ''],
	objurl: L.Catalog.vizierURL + '/VizieR-5?-source=V/139&-c={ra},{dec},eq=J2000&-c.rs=0.01'
});

L.Catalog.SDSS12 = L.extend({}, L.Catalog, {
	service: 'Vizier@CDS',
	name: 'SDSS Release 12',
	className: 'logo-catalog-vizier',
	attribution: 'SDSS Photometric Catalogue, Release 12 (Alam+, 2015)',
	color: 'pink',
	maglim: 25.0,
	regionType: 'box',
	url: L.Catalog.vizierURL + '/asu-tsv?&-mime=csv&-source=V/147&' +
	 '-out=SDSS12,RA_ICRS,DE_ICRS,umag,e_umag,gmag,e_gmag,rmag,e_rmag,imag,e_imag,zmag,e_zmag,zsp,e_zsp&-out.meta=&' +
	 '-c.eq={sys}&-c={lng},{lat}&-c.bd={dlng},{dlat}&-out.max={nmax}&-sort=gmag',
	properties: ['u', 'g', 'r', 'i', 'z'],
	units: ['', '', '', '', ''],
	objurl: L.Catalog.vizierURL + '/VizieR-5?-source=V/147&-c={ra},{dec},eq=J2000&-c.rs=0.01'
});

L.Catalog.PPMXL = L.extend({}, L.Catalog, {
	service: 'Vizier@CDS',
	name: 'PPMXL',
	className: 'logo-catalog-vizier',
	attribution: 'PPM-Extended, positions and proper motions (Roeser et al. 2008)',
	color: 'green',
	maglim: 20.0,
	regionType: 'box',
	url: L.Catalog.vizierURL + '/asu-tsv?&-mime=csv&-source=I/317&' +
	 '-out=PPMXL,RAJ2000,DEJ2000,Jmag,Hmag,Kmag,b1mag,b2mag,r1mag,r2mag,imag,pmRA,pmDE&-out.meta=&' +
	 '-c.eq={sys}&-c={lng},{lat}&-c.bd={dlng},{dlat}&-out.max={nmax}&-sort=Jmag',
	properties: ['J', 'H', 'K', 'b<sub>1</sub>', 'b<sub>2</sub>', 'r<sub>1</sub>',
	             'r<sub>2</sub>', 'i',
	             '&#956;<sub>&#593;</sub> cos &#948;', '&#956;<sub>&#948;</sub>'],
	units: ['', '', '', '', '', '', '', '', 'mas/yr', 'mas/yr'],
	objurl: L.Catalog.vizierURL + '/VizieR-5?-source=I/317&-c={ra},{dec},eq=J2000&-c.rs=0.01'
});

L.Catalog.Abell = L.extend({}, L.Catalog, {
	service: 'Vizier@CDS',
	name: 'Abell clusters',
	className: 'logo-catalog-vizier',
	attribution: 'Rich Clusters of Galaxies (Abell et al. 1989) ',
	color: 'orange',
	maglim: 30.0,
	regionType: 'box',
	url: L.Catalog.vizierURL + '/asu-tsv?&-mime=csv&-source=VII/110A&' +
	 '-out=ACO,_RAJ2000,_DEJ2000,m10,Rich,Dclass&-out.meta=&' +
	 '-c.eq={sys}&-c={lng},{lat}&-c.bd={dlng},{dlat}&-out.max={nmax}&-sort=m10',
	properties: ['m<sub>10</sub>', 'Richness', 'D<sub>class</sub>'],
	units: ['', '', ''],
	objurl: L.Catalog.vizierURL + '/VizieR-5?-source=VII/110A&-c={ra},{dec},eq=J2000&-c.rs=0.2'
});

L.Catalog.NVSS = L.extend({}, L.Catalog, {
	service: 'Vizier@CDS',
	name: 'NVSS',
	className: 'logo-catalog-vizier',
	attribution: '1.4GHz NRAO VLA Sky Survey (NVSS) (Condon et al. 1998)',
	color: 'magenta',
	maglim: 30.0,
	regionType: 'box',
	url: L.Catalog.vizierURL + '/asu-tsv?&-mime=csv&-source=VIII/65/NVSS&' +
	 '-out=NVSS,_RAJ2000,_DEJ2000,S1.4,MajAxis,MinAxis,PA&-out.meta=&' +
	 '-c.eq={sys}&-c={lng},{lat}&-c.bd={dlng},{dlat}&-out.max={nmax}&-sort=-S1.4',
	properties: ['S<sub>1.4GHz</sub>', 'Major axis', 'Minor axis', 'Position angle'],
	units: ['mJy', '&#8243;', '&#8243;', '&#176;'],
	objurl: L.Catalog.vizierURL + '/VizieR-5?-source=VIII/65/NVSS&-c={ra},{dec},eq=J2000&-c.rs=0.2',
	draw: function (feature, latlng) {
		return L.ellipse(latlng, {
			majAxis: feature.properties.items[1] / 7200.0,
			minAxis: feature.properties.items[2] / 7200.0,
			posAngle: feature.properties.items[3] === '--' ? 0.0 : feature.properties.items[3]
		});
	}
});

L.Catalog.FIRST = L.extend({}, L.Catalog, {
	service: 'Vizier@CDS',
	name: 'FIRST',
	className: 'logo-catalog-vizier',
	attribution: 'The FIRST Survey Catalog (Helfand et al. 2015)',
	color: 'blue',
	maglim: 30.0,
	regionType: 'box',
	url: L.Catalog.vizierURL + '/asu-tsv?&-mime=csv&-source=VIII/92/first14&' +
	 '-out=FIRST,_RAJ2000,_DEJ2000,Fpeak,fMaj,fMin,fPA&-out.meta=&' +
	 '-c.eq={sys}&-c={lng},{lat}&-c.bd={dlng},{dlat}&-out.max={nmax}&-sort=-Fpeak',
	properties: ['F<sub>peak</sub>(1.4GHz)', 'Major axis FWHM', 'Minor axis FWHM', 'Position angle'],
	units: ['mJy', '&#8243;', '&#8243;', '&#176;'],
	objurl: L.Catalog.vizierURL + '/VizieR-5?-source=VIII/92/first14&-c={ra},{dec},eq=J2000&-c.rs=0.2',
	draw: function (feature, latlng) {
		return L.ellipse(latlng, {
			majAxis: feature.properties.items[1] / 7200.0,
			minAxis: feature.properties.items[2] / 7200.0,
			posAngle: feature.properties.items[3] === '--' ? 0.0 : feature.properties.items[3]
		});
	}
});

L.Catalog.AllWISE = L.extend({}, L.Catalog, {
	service: 'Vizier@CDS',
	name: 'AllWISE',
	className: 'logo-catalog-vizier',
	attribution: 'AllWISE Data Release (Cutri et al. 2013)',
	color: 'red',
	maglim: 18.0,
	regionType: 'box',
	url: L.Catalog.vizierURL + '/asu-tsv?&-mime=csv&-source=II/328/allwise&' +
	 '-out=AllWISE,_RAJ2000,_DEJ2000,W1mag,W2mag,W3mag,W4mag&-out.meta=&' +
	 '-c.eq={sys}&-c={lng},{lat}&-c.bd={dlng},{dlat}&-out.max={nmax}&-sort=W1mag',
	properties: ['W1<sub>mag</sub> (3.4µm)', 'W2<sub>mag</sub> (4.6µm)',
	  'W3<sub>mag</sub> (12µm)', 'W4<sub>mag</sub> (22µm)'],
	units: ['', '', '', ''],
	objurl: L.Catalog.vizierURL + '/VizieR-5?-source=II/328/allwise&-c={ra},{dec},eq=J2000&-c.rs=0.2'
});

L.Catalog.GALEX_AIS = L.extend({}, L.Catalog, {
	service: 'Vizier@CDS',
	name: 'GALEX AIS',
	className: 'logo-catalog-vizier',
	attribution: 'GALEX catalogs of UV sources: All-sky Imaging Survey (Bianchi et al. 2011)',
	color: 'magenta',
	maglim: 21.0,
	regionType: 'box',
	url: L.Catalog.vizierURL + '/asu-tsv?&-mime=csv&-source=II/312/ais&' +
	 '-out=objid,_RAJ2000,_DEJ2000,FUV,NUV&-out.meta=&' +
	 '-c.eq={sys}&-c={lng},{lat}&-c.bd={dlng},{dlat}&-out.max={nmax}&-sort=FUV',
	properties: ['FUV<sub>AB</sub>', 'NUV<sub>AB</sub>'],
	units: ['', ''],
	objurl: L.Catalog.vizierURL + '/VizieR-5?-source=II/312/ais&-c={ra},{dec},eq=J2000&-c.rs=0.2'
});

L.Catalog.GAIA_DR1 = L.extend({}, L.Catalog, {
	service: 'Vizier@CDS',
	name: 'Gaia DR1',
	className: 'logo-catalog-vizier',
	attribution: 'First Gaia Data Release (2016)',
	color: 'green',
	maglim: 20.0,
	regionType: 'box',
	url: L.Catalog.vizierURL + '/asu-tsv?&-mime=csv&-source=I/337&' +
	 '-out=Source,RA_ICRS,DE_ICRS,Plx,e_Plx,pmRA,e_pmRA,pmDE,e_pmDE,<Gmag>,BPmag,e_BPmag,RPmag,e_RPmag,RV,e_RV&-out.meta=&' +
	 '-c.eq={sys}&-c={lng},{lat}&-c.bd={dlng},{dlat}&-out.max={nmax}&-sort=Gmag',
	properties: ['G', '&#956;<sub>&#593;</sub> cos &#948;', '&#956;<sub>&#948;</sub>'],
	units: ['', 'mas/yr', 'mas/yr'],
	objurl: L.Catalog.vizierURL + '/VizieR-5?-source=I/337&-c={ra},{dec},eq=J2000&-c.rs=0.01'
});

L.Catalog.GAIA_DR2 = L.extend({}, L.Catalog, {
	service: 'Vizier@CDS',
	name: 'Gaia DR2',
	className: 'logo-catalog-vizier',
	attribution: 'Second Gaia Data Release (2018)',
	color: 'purple',
	maglim: 20.0,
	regionType: 'box',
	url: L.Catalog.vizierURL + '/asu-tsv?&-mime=csv&-source=I/345&' +
		'-out=Source,RA_ICRS,DE_ICRS,Plx,e_Plx,pmRA,e_pmRA,pmDE,e_pmDE,Gmag,e_Gmag,BPmag,e_BPmag,RPmag,e_RPmag,RV,e_RV&-out.meta=&' +
		'-c.eq={sys}&-c={lng},{lat}&-c.bd={dlng},{dlat}&-out.max={nmax}&-sort=Gmag',
	properties: ['G', '&#956;<sub>&#593;</sub> cos &#948;', '&#956;<sub>&#948;</sub>'],
	units: ['', 'mas/yr', 'mas/yr'],
	objurl: L.Catalog.vizierURL + '/VizieR-5?-source=I/345&-c={ra},{dec},eq=J2000&-c.rs=0.01'
});

L.Catalog.URAT_1 = L.extend({}, L.Catalog, {
	service: 'Vizier@CDS',
	name: 'URAT1',
	className: 'logo-catalog-vizier',
	attribution: 'The first U.S. Naval Observatory Astrometric Robotic Telescope Catalog (Zacharias et al. 2015)',
	color: 'yellow',
	maglim: 17.0,
	regionType: 'box',
	url: L.Catalog.vizierURL + '/asu-tsv?&-mime=csv&-source=I/329&' +
	 '-out=URAT1,RAJ2000,DEJ2000,f.mag,pmRA,pmDE&-out.meta=&' +
	 '-c.eq={sys}&-c={lng},{lat}&-c.bd={dlng},{dlat}&-out.max={nmax}&-sort=f.mag',
	properties: ['f<sub>mag</sub>', '&#956;<sub>&#593;</sub> cos &#948;', '&#956;<sub>&#948;</sub>'],
	units: ['', 'mas/yr', 'mas/yr'],
	objurl: L.Catalog.vizierURL + '/VizieR-5?-source=I/329&-c={ra},{dec},eq=J2000&-c.rs=0.01'
});

L.Catalog.PanStarrs = L.extend({}, L.Catalog, {
	service: 'MAST@STScI',
	name: 'Pan-Starrs1',
	className: 'logo-catalog-mast',
	attribution: 'The Pan-STARRS1 Database and Data Products (Flewelling et al. 2016)',
	color: 'yellow',
	maglim: 24.0,
	magindex: 1,
	regionType: 'cone',
	url: L.Catalog.mastURL + '/panstarrs/search.php?' +
	 'action=Search&target=&radius={drm}&ra={lng}&dec={lat}&equinox={sys}&nDetections=%3E+1&' +
	 'selectedColumnsCsv=objname%2Cramean%2Cdecmean%2C' +
	 'gmeankronmag%2Crmeankronmag%2Cimeankronmag%2Czmeankronmag%2Cymeankronmag%2CqualityFlag&' +
	 'selectedColumnsList%5B%5D=rmeankronmag&availableColumns=objname&ordercolumn1=gmeankronmag&' +
	 'coordformat=dec&outputformat=TSV&max_records={nmax}',
	properties: ['g', 'r', 'i', 'z', 'y', 'quality'],
	units: ['', '', '', '', '', ''],
	propertyMask: [true, true, true, true, true, false],
	readProperty: function (item) {
		var	fitem = parseFloat(item);
		return fitem < 0.0 ? '--' : fitem;
	},
	objurl: L.Catalog.mastURL + '/panstarrs/search.php?' +
	 'action=Search&target=&radius=0.001&ra={ra}&dec={dec}&equinox=J2000&nDetections=%3E+1',
	filter: function (feature) {
		return parseFloat(feature.properties.items[5]) >= 40;
	}
});

L.Catalog.GLEAM = L.extend({}, L.Catalog, {
	service: 'Vizier@CDS',
	name: 'GLEAM',
	className: 'logo-catalog-vizier',
	attribution: 'GaLactic and Extragalactic All-sky Murchison Wide Field Array (GLEAM)' +
	    ' low-frequency extragalactic catalogue (Hurley-Walker et al. 2017)',
	color: 'blue',
	maglim: 30.0,
	regionType: 'box',
	url: L.Catalog.vizierURL + '/asu-tsv?&-mime=csv&-source=VIII/100/gleamegc&' +
	 '-out=GLEAM,RAJ2000,DEJ2000,Fintwide,awide,bwide,pawide&-out.meta=&' +
	 '-c.eq={sys}&-c={lng},{lat}&-c.bd={dlng},{dlat}&-out.max={nmax}&-sort=-Fintwide',
	properties: ['F<sub>int</sub>(170-231MHz)', 'Major axis FWHM', 'Minor axis FWHM', 'Position angle'],
	units: ['Jy', '&#8243;', '&#8243;', '&#176;'],
	objurl: L.Catalog.vizierURL + '/VizieR-5?-source=VIII/100/gleamegc&-c={ra},{dec},eq=J2000&-c.rs=0.2',
	draw: function (feature, latlng) {
		return L.ellipse(latlng, {
			majAxis: feature.properties.items[1] / 3600.0,
			minAxis: feature.properties.items[2] / 3600.0,
			posAngle: feature.properties.items[3] === '--' ? 0.0 : feature.properties.items[3]
		});
	}
});

L.Catalog.TGSS = L.extend({}, L.Catalog, {
	service: 'Vizier@CDS',
	name: 'TGSS',
	className: 'logo-catalog-vizier',
	attribution: 'The GMRT 150 MHz all-sky radio survey. TGSS ADR1 (Intema et al. 2017)',
	color: 'blue',
	maglim: 30.0,
	regionType: 'box',
	url: L.Catalog.vizierURL + '/asu-tsv?&-mime=csv&-source=J/A%2bA/598/A78/table3&' +
	 '-out=TGSSADR,RAJ2000,DEJ2000,Stotal,Maj,Min,PA&-out.meta=&' +
	 '-c.eq={sys}&-c={lng},{lat}&-c.bd={dlng},{dlat}&-out.max={nmax}&-sort=-Stotal',
	properties: ['F<sub>peak</sub>(150MHz)', 'Major axis FWHM', 'Minor axis FWHM', 'Position angle'],
	units: ['mJy', '&#8243;', '&#8243;', '&#176;'],
	objurl: L.Catalog.vizierURL + '/VizieR-3?-source=J/A%2bA/598/A78/table3&-c={ra},{dec},eq=J2000&-c.rs=0.2',
	draw: function (feature, latlng) {
		return L.ellipse(latlng, {
			majAxis: feature.properties.items[1] / 7200.0,
			minAxis: feature.properties.items[2] / 7200.0,
			posAngle: feature.properties.items[3] === '--' ? 0.0 : feature.properties.items[3]
		});
	}
});

L.Catalog.PS1 = L.extend({}, L.Catalog, {
	service: 'Vizier@CDS',
	name: 'PS1',
	className: 'logo-catalog-vizier',
	attribution: 'The Pan-STARRS release 1 (PS1) Survey - DR1 (Chambers+, 2016)',
	color: 'blue',
	maglim: 30.0,
	regionType: 'box',
	url: L.Catalog.vizierURL + '/asu-tsv?&-mime=csv&-source=II/349&' +
		'-out=objID,RAJ2000,DEJ2000,gmag,e_gmag,rmag,e_rmag,imag,e_imag,zmag,e_zmag,ymag_e_ymag,gKmag,e_gKmag,rKmag,e_rKmag,iKmag,e_iKmag,zKmag,e_zKmag,yKmag,e_yKmag&-out.meta=&' +
		'-c.eq={sys}&-c={lng},{lat}&-c.bd={dlng},{dlat}&-out.max={nmax}&-sort=-gmag',
	properties: ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
	units: ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
	objurl: L.Catalog.vizierURL + '/VizieR-3?-source=II/349&-c={ra},{dec},eq=J2000&-c.rs=0.2',
});

L.Catalog.HSC2 = L.extend({}, L.Catalog, {
	service: 'Vizier@CDS',
	name: 'HSC2',
	className: 'logo-catalog-vizier',
	attribution: 'Hubble Source Catalog (V1 and V2) (Whitmore+, 2016)',
	color: 'blue',
	maglim: 30.0,
	regionType: 'box',
	url: L.Catalog.vizierURL + '/asu-tsv?&-mime=csv&-source=II/342/hsc2&' +
		'-out=Source,RAJ2000,DEJ2000,Filter,magAper2,magAuto&-out.meta=&' +
		'-c.eq={sys}&-c={lng},{lat}&-c.bd={dlng},{dlat}&-out.max={nmax}&-sort=-magAuto',
	properties: ['', '', '',],
	units: ['', '', ''],
	objurl: L.Catalog.vizierURL + '/VizieR-3?-source=II/342/hsc2&-c={ra},{dec},eq=J2000&-c.rs=0.2',
});