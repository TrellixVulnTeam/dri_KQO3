/**
 *
 */
Ext.define('Target.view.objects.ObjectsController', {
    extend: 'Ext.app.ViewController',

    alias: 'controller.objects',

    requires: [
        'Target.view.association.Panel',
        'Target.model.Rating',
        'Target.model.Reject',
        'Target.view.wizard.Wizard',
        'Target.view.objects.FiltersWindow',
        'Target.view.objects.SaveCatalogWindow',
        'Target.view.objects.DownloadWindow',
        'Target.view.settings.CutoutJobForm',
        'Target.view.objects.CutoutJobDetailWindow',
        'common.comment.CommentsObject'
    ],

    listen: {
        component: {
            'targets-objects-panel': {
                beforeLoadPanel: 'onBeforeLoadPanel',
                beforeloadcatalog: 'loadCurrentSetting',
                beforedeactivate: 'onBeforeDeactivate'
            },
            'targets-objects-mosaic': {
                onChangeCutoutJob: 'onChangeCutoutJob',
            },
        },
        store: {
            '#Catalogs': {
                load: 'onLoadCatalogs'
            },
            '#objects': {
                load: 'onLoadObjects',
                update: 'onUpdateObject'
            }
        }
    },

    winAlertSetting: null,
    winFilters: null,
    winSaveAs: null,
    wizard: null,
    winDownload: null,
    winCutout: null,
    winCutoutjobInfo: null,
    activeFilter: null,
    winComment: null,


    onBeforeLoadPanel: function (catalogId, objectsPanel) {
        // console.log('1 - onBeforeLoadPanel');
        var me = this,
            vm = objectsPanel.getViewModel(),
            catalogs = vm.getStore('catalogs'),
            refs = me.getReferences(),
            objectsGrid = refs.targetsObjectsGrid;

        objectsGrid.setLoading(true);

        catalogs.removeAll();
        catalogs.clearFilter(true);
        catalogs.filter([
            {
                property: 'id',
                value: catalogId
            }
        ]);
    },

    onLoadCatalogs: function (store) {
        // console.log('2 - onLoadCatalogs');
        var me = this,
            vm = me.getViewModel(),
            currentCatalog;

        if (store.count() === 1) {
            currentCatalog = store.first();

            vm.set('currentCatalog', currentCatalog);

            me.loadCurrentSetting();

            // Carrega a Lista de Cutouts Jobs para este Produto.
            me.loadCutoutJobs(currentCatalog.get('id'));
        }
    },

    /**
     * Carrega a Lista de Cutout Jobs
     * relacioandas a um produto e com status ok ou seja finalizados.
     * ordenados pelo mais recente.
     * @param  {Number} productId Id do produto/catalogo que está sendo visualizado.
     */
    loadCutoutJobs: function (productId) {
        // console.log('loadCutoutJobs(%o)', productId)
        var me = this,
            vm = me.getViewModel(),
            cutoutsJobs = vm.getStore('cutoutjobs');

        // Apenas os jobs relacioandos ao produto e finalizados.
        cutoutsJobs.addFilter([
            {
                property: 'cjb_product',
                value: productId
            },
            {
                property: 'cjb_status',
                value: 'ok'
            }
        ]);

        // Ordenados pelo mais recente.
        cutoutsJobs.setSorters([
            {
                property: 'cjb_finish_time',
                direction: 'DESC'
            }
        ]);

        cutoutsJobs.load({
            callback: function () {
                me.onLoadCutoutJobs(cutoutsJobs);
            }
        });
    },

    /**
     * Executado toda vez que que a store cutoutJobs for carregada.
     * Verifica se o painel Mosaic já tem algum job selecioando,
     * se não tiver seleciona o job mais recente por default.
     * @param  {Target.store.CutoutJobs} store Instancia da cutoutJobs
     * store que está no viewModel.
     */
    onLoadCutoutJobs: function (store) {
        // console.log('onLoadCutoutJobs(%o)', store);
        var me = this,
            vm = me.getViewModel(),
            cutoutJob = vm.get('cutoutJob');

        // Toda vez que a store de Jobs for carregada
        // Verificar se o painel mosaic já tem algum cutout job selecionado.
        if ((cutoutJob) && (cutoutJob.get('id') > 0)) {
            // Já tem um cutoutJob selecionado não faz nada.
            return
        }

        // Se não tiver seleciona o cutout job mais recente.
        // vm.set('cutoutJob', store.first());

    },

    onChangeCutoutJob: function (cutoutJob, mosaicPanel) {
        // console.log('onChangeCutoutJob(%o)', cutoutJob);
        var me = this,
            vm = me.getViewModel(),
            imagesFormat = vm.getStore('imagesFormat'),
            combo = me.lookup('cmbCutoutImage'),
            imgDefault;

        // Verifica se existe no job a imagem Stiff nas cores gri.
        imgDefault = imagesFormat.getAt(imagesFormat.findExact('name', 'stiff_irg'));

        if ((imgDefault) && (imgDefault !== -1)) {
            // Usa a imagem stiff gri como default.
            combo.select(imgDefault);
        } else {
            // Se a imagem default existir para este job usa a primeira disponivel.
            combo.select(imagesFormat.first());
        }

        // Carrega a Store de Cutouts.
        me.loadCutouts();
    },

    loadCurrentSetting: function () {
        // console.log('3 - loadCurrentSetting');
        var me = this,
            vm = me.getViewModel(),
            store = vm.getStore('currentSettings'),
            product = vm.get('currentCatalog'),
            refs = me.getReferences(),
            objectsGrid = refs.targetsObjectsGrid;

        //objectsGrid.setLoading(true);

        store.addFilter([
            {
                property: 'cst_product',
                value: product.get('id')
            }
        ]);

        store.load({
            callback: function (records, operations, success) {

                //objectsGrid.setLoading(false);

                if ((success) && (records.length == 1)) {
                    vm.set('currentSetting', records[0]);

                    me.configurePanelBySettings();

                } else if (((success) && (records.length > 1))) {
                    // Mais de uma setting
                    vm.set('currentSetting', records[records.length - 1]);

                    me.configurePanelBySettings();

                } else {
                    me.configurePanelWithoutSettings();

                }
            }
        });
    },

    configurePanelBySettings: function () {
        // console.log('4 - configurePanelBySettings');
        var me = this,
            vm = me.getViewModel(),
            store = vm.getStore('displayContents'),
            currentSetting = vm.get('currentSetting');

        store.addFilter([
            { 'property': 'pcn_product_id', value: currentSetting.get('cst_product') },
            { 'property': 'pca_setting', value: currentSetting.get('cst_setting') }
        ]);

        store.load({
            callback: function () {
                me.onLoadProductContent(store);

            }
        });
    },

    configurePanelWithoutSettings: function () {
        // console.log('4 - configurePanelWithoutSettings');
        var me = this,
            vm = me.getViewModel(),
            currentCatalog = vm.get('currentCatalog'),
            store = vm.getStore('displayContents');

        store.addFilter([
            { 'property': 'pcn_product_id', value: currentCatalog.get('id') }
        ]);

        store.load({
            callback: function () {
                me.onLoadProductContent(store);

            }
        });
    },

    onLoadProductContent: function (productContent) {
        // console.log('5 - onLoadProductContent');
        var me = this,
            refs = me.getReferences(),
            objectsGrid = refs.targetsObjectsGrid;

        // Checar se tem as associacoes obrigatorias
        if (productContent.check_ucds()) {
            objectsGrid.reconfigureGrid(productContent);

        } else {
            if (!productContent.check_ucds()) {
                Ext.MessageBox.show({
                    header: false,
                    closable: false,
                    msg: 'It is necessary to make association for property ID, RA and Dec.',
                    buttons: Ext.MessageBox.OKCANCEL,
                    fn: function (btn) {
                        if (btn === 'ok') {
                            me.showAssociation();
                        } else {
                            me.redirectTo('home');
                        }
                    }
                });
            }
        }
    },

    reloadAssociation: function () {
        var me = this;

        me.loadCurrentSetting();
    },

    onLoadAssociation: function (productAssociation) {
        // console.log('6 - onLoadAssociation');
        var me = this,
            refs = me.getReferences(),
            objectsGrid = refs.targetsObjectsGrid;

        if (productAssociation.count() > 0) {

            objectsGrid.setCatalogClassColumns(productAssociation);
        } else {
            if (!this.winAssociation) {
                me.showAssociation();
            }
        }
    },

    onGridObjectsReady: function () {
        // console.log('7 - onGridObjectsReady');
        var me = this,
            vm = this.getViewModel(),
            catalog = vm.get('currentCatalog');

        // Filtrar a Store de Objetos
        me.loadObjects(catalog.get('id'));

    },

    loadObjects: function (catalog, filters) {
        // console.log('8 - loadObjects');
        var me = this,
            vm = me.getViewModel(),
            currentCatalog = vm.get('currentCatalog'),
            store = vm.getStore('objects'),
            refs = me.getReferences(),
            objectsGrid = refs.targetsObjectsGrid,
            aFilters = [];

        if (!catalog) {
            catalog = currentCatalog.get('id');
        }

        if (catalog > 0) {

            // flag indicando que nao ha nenhum filtro salvo ativo.
            vm.set('haveFilter', false);

            store.clearFilter();

            store.getProxy().setExtraParam('product', catalog);

            // Se nao recebeu filtro pelo parametro verifica se tem filtro setado no viewModel
            if (!filters) {
                filters = vm.get('filters');
            }

            // Aplicar Filtros ao Produto
            if ((filters) && (filters.count() > 0)) {

                filters.each(function (filter) {

                    // Altera o valor da flag para indicar que ha um filtro salvo
                    // sendo aplicado.
                    if (filter.get('filterset') > 0) {
                        vm.set('haveFilter', true);
                    }

                    aFilters.push({
                        property: filter.get('fcd_property_name'),//property_name'),
                        operator: filter.get('fcd_operation'),
                        value: filter.get('fcd_value')
                    });

                }, me);

                // Aplicar os Filtros
                if ((aFilters.length > 0)) {
                    store.addFilter(aFilters);
                }
            }

            store.load();
        }
    },

    onLoadObjects: function (store, records, successful, operation) {
        // console.log('9 - onLoadObjects');
        var me = this,
            vm = me.getViewModel(),
            refs = me.getReferences(),
            preview = refs.targetsPreviewPanel,
            objectsGrid = me.lookup('targetsObjectsGrid');

        //limpa o preview
        preview.clear();
        objectsGrid.setLoading(false);

        if (!successful) {
            // Se teve alguma falha limpar a grid.
            me.clearObjects();
            var error = operation.getError();

            Ext.MessageBox.show({
                // title: error.status + ' - ' + error.statusText,
                msg: 'Sorry there was an error, and it was not possible to list the objects.',
                buttons: Ext.MessageBox.OK,
                icon: Ext.MessageBox.WARNING
            });
        } else {
            if (records.length > 0) {
                vm.set('haveResults', true);

            } else {
                vm.set('haveResults', false);
            }
        }
    },

    clearObjects: function () {
        // console.log('clearObjects');
        var vm = this.getViewModel(),
            objects = vm.getStore('objects');

        objects.removeAll(true);
        objects.clearFilter(true);
    },

    reloadObjects: function () {
        // console.log('reloadObjects');
        var me = this,
            vm = me.getViewModel(),
            catalog = vm.get('catalog');

        me.clearObjects();

        me.loadObjects(catalog);
    },

    onSelectObject: function (selModel, record) {
        var me = this,
            view = me.getView(),
            vm = view.getViewModel(),
            refs = me.getReferences(),
            preview = refs.targetsPreviewPanel,
            catalog = vm.get('currentCatalog');

        vm.set('currentRecord', record);

        // Setar o Objeto Selecionado
        preview.setCurrentRecord(record, catalog);

    },

    onUpdateObject: function (store, record, operation, modifiedFieldNames) {
        if (modifiedFieldNames) {
            // Caso o campo alterado seja o reject
            if (modifiedFieldNames.indexOf('_meta_reject') >= 0) {
                this.onRejectTarget(record, store);
            }

            // Caso o campo alterado seja Rating
            if (modifiedFieldNames.indexOf('_meta_rating') >= 0) {
                this.onRatingTarget(record, store);
            }
        }
    },

    onRejectTarget: function (record, store) {
        var me = this,
            view = me.getView().down('targets-objects-grid'),
            reject;

        view.setLoading('Saving...');

        if (!record.get('_meta_reject_id')) {
            // Criar um novo registro de Reject sem ID
            reject = Ext.create('Target.model.Reject', {
                'catalog_id': record.get('_meta_catalog_id'),
                'object_id': record.get('_meta_id'),
                'reject': true
            });

            reject.save({
                callback: function (savedReject, operation, success) {
                    if (success) {
                        // recupera o objeto inserido no banco de dados
                        var obj = Ext.decode(operation.getResponse().responseText);

                        // seta no record da grid o atributo reject_id para que nao seja necessario
                        // o reload da grid
                        record.set('_meta_reject_id', obj.id);

                        store.commitChanges();

                        view.setLoading(false);
                    }
                }
            });

        } else {
            // Se ja tiver o registro de Reject deleta
            reject = Ext.create('Target.model.Reject', {
                'id': record.get('_meta_reject_id')
            });

            reject.erase({
                callback: function (savedReject, operation, success) {
                    if (success) {
                        record.set('_meta_reject_id', null);

                        store.commitChanges();

                        view.setLoading(false);
                    }
                }
            });
        }
    },

    onRatingTarget: function (record, store) {
        // console.log('onRatingTarget(%o)', record)
        var me = this,
            view = me.getView().down('targets-objects-grid'),
            rating;

        view.setLoading('Saving...');


        if (record.get('_meta_rating_id') > 0) {
            // Cria um model com o id que ja existe no banco de dados
            rating = Ext.create('Target.model.Rating', {
                'id': record.get('_meta_rating_id')
            });

            // faz o set no atributo que vai ser feito update
            if (record.get('_meta_rating') > 0) {
                rating.set('rating', record.get('_meta_rating'));

                rating.save({
                    callback: function (savedRating, operation, success) {
                        if (success) {
                            var obj = Ext.decode(operation.getResponse().responseText);

                            record.set('_meta_rating_id', obj.id);

                            store.commitChanges();

                            view.setLoading(false);
                        }
                    }
                });

            } else {
                rating.erase({
                    callback: function (savedRating, operation, success) {
                        if (success) {
                            record.set('_meta_rating_id', null);

                            store.commitChanges();

                            view.setLoading(false);
                        }
                    }
                });

            }

        } else {
            // Criar um novo registro de Rating sem ID
            rating = Ext.create('Target.model.Rating', {
                'catalog_id': record.get('_meta_catalog_id'),
                'object_id': record.get('_meta_id'),
                'rating': record.get('_meta_rating')
            });

            rating.save({
                callback: function (savedRating, operation, success) {
                    if (success) {
                        // recupera o objeto inserido no banco de dados
                        var obj = Ext.decode(operation.getResponse().responseText);

                        // seta no record da grid o atributo rating_id para que nao seja necessario
                        // o reload da grid
                        record.set('_meta_rating_id', obj.id);

                        store.commitChanges();

                        view.setLoading(false);
                    }
                }
            });
        }
    },

    onClickSettings: function () {
        var me = this;

        me.showWizard();
    },

    onChangeInObjects: function () {
        // toda vez que houver uma modificacao no objeto ex. comentarios
        // atualiza a store de objetos
        var me = this,
            vm = me.getViewModel(),
            store = vm.getStore('objects'),
            currentRecord = vm.get('currentRecord'),
            grid = me.lookup('targetsObjectsGrid');

        //console.log('Houve mudanca no objeto');
        store.load({
            scope: this,
            callback: function () {
                // Todo caso seja necessario selecionar o record que estava selecionado antes
                grid.selModel.select(currentRecord, false);
            }
        });

    },

    showWizard: function () {
        var me = this,
            vm = me.getViewModel(),
            catalog = vm.get('catalog'),
            currentCatalog = vm.get('currentCatalog'),
            currentSetting = vm.get('currentSetting');

        me.wizard = Ext.create('Ext.window.Window', {
            title: 'Settings',
            layout: 'fit',
            closable: true,
            closeAction: 'destroy',
            width: 880,
            height: 500,
            modal: true,
            items: [{
                xtype: 'targets-wizard',
                product: catalog,
                listeners: {
                    scope: me,
                    finish: 'onFinishWizard',
                    close: 'onFinishWizard'
                }
            }]
        });

        if (currentSetting.get('id') > 0) {
            me.wizard.down('targets-wizard').setCurrentSetting(currentSetting);
        }

        me.wizard.down('targets-wizard').setCurrentCatalog(currentCatalog);

        me.wizard.show();

    },

    onFinishWizard: function () {
        this.wizard.close();

        this.loadCurrentSetting();

    },

    showAssociation: function () {
        var me = this,
            currentCatalog = me.getViewModel().get('currentCatalog');

        me.winAssociation = Ext.create('Ext.window.Window', {
            title: 'Association',
            layout: 'fit',
            closable: true,
            closeAction: 'destroy',
            width: 800,
            height: 620,
            modal: true,
            items: [{
                xtype: 'targets-association',
                listeners: {
                    scope: me,
                    finish: 'onFinishAssociation',
                    close: 'onFinishAssociation',
                    cancel: 'onFinishAssociation'

                }
            }]
        });

        me.winAssociation.down('targets-association').setCatalog(currentCatalog);

        me.winAssociation.show();

    },

    onFinishAssociation: function () {
        var me = this;

        me.onCloseAssociation();

        me.loadCurrentSetting();
    },

    onCloseAssociation: function () {
        var me = this;

        if (me.winAssociation) {
            me.winAssociation.close();
        }
    },

    onBeforeDeactivate: function () {
        var me = this;
        // Fix AlertSetting quando usa funcao voltar do navegador
        if (me.winAlertSetting !== null) {
            me.winAlertSetting.close();
            me.winAlertSetting = null;
        }

        if (me.wizard !== null) {
            me.wizard.close();
            me.wizard = null;
        }

        if (me.winComment !== null) {
            me.winComment.close();
            me.winComment = null;
        }

        if (me.winFilters !== null) {
            me.winFilters.close();
            me.winFilters = null;
        }

        if (me.winSaveAs !== null) {
            me.winSaveAs.close();
            me.winSaveAs = null;
        }

        if (me.winDownload !== null) {
            me.winDownload.close();
            me.winDownload = null;
        }

        if (me.winCutout !== null) {
            me.winCutout.close();
            me.winCutout = null;
        }

        if (me.winCutoutjobInfo !== null) {
            me.winCutoutjobInfo.close();
            me.winCutoutjobInfo = null;
        }
    },

    onClickFilter: function () {
        var me = this,
            vm = me.getViewModel(),
            filterset = vm.get('filterSet'),
            filters = vm.get('filters'),
            store = vm.getStore('objects'),
            currentCatalog = vm.get('currentCatalog');

        if (me.winFilters !== null) {
            me.winFilters.close();
            me.winFilters = null;
        }

        me.winFilters = Ext.create('Target.view.objects.FiltersWindow', {
            listeners: {
                scope: me,
                applyfilters: 'onWindowApplyFilters',
                disapplyfilters: 'onWindowDisapplyFilters'
            }
        });

        me.winFilters.setCurrentCatalog(currentCatalog);
        me.winFilters.setActiveFilter(me.activeFilter);

        me.winFilters.show();
    },

    /**
     * Ao aplicar filtro na window filters
     */
    onWindowApplyFilters: function (filter) {//filterset, filters) {
        var me = this, a = [],
            vm = me.getViewModel(),  //
            txtFilterSet = me.lookup('txtFilterSet'),
            currentCatalog = vm.get('currentCatalog');

        me.activeFilter = filter;

        txtFilterSet.setValue(filter.fst_name);
        vm.set('filters', filter.storeFilters);
        me.loadObjects(currentCatalog.get('id'), filter.storeFilters);
    },

    onWindowDisapplyFilters: function () {
        var me = this,
            vm = me.getViewModel(),
            txtFilterSet = me.lookup('txtFilterSet'),
            filterset;

        filterset = Ext.create('Target.model.FilterSet', {});

        txtFilterSet.reset();

        vm.set('filterSet', filterset);
        vm.set('filters', null);

        me.activeFilter = null;

        me.loadObjects();
    },

    onClickComment: function () {
        // console.log('onClickComment()')

        var me = this,
            view = me.getView(),
            vm = view.getViewModel(),
            currentRecord = vm.get('currentRecord');

        if (me.winComment !== null) {
            me.winComment.close();
            me.winComment = null;
        }
        if ((currentRecord) && (currentRecord.get('_meta_id') !== null)) {

            me.winComment = Ext.create('Ext.window.Window', {
                title: 'Comments',
                iconCls: 'x-fa fa-comments',
                layout: 'fit',
                closeAction: 'destroy',
                constrainHeader: true,
                width: 500,
                height: 300,
                modal: true,
                items: [
                    {
                        xtype: 'comments-object',
                        listeners: {
                            scope: this,
                            changecomments: 'onChangeInObjects'
                        }
                    }
                ]
            });

            me.winComment.down('comments-object').setObject(
                currentRecord.get('_meta_catalog_id'),
                currentRecord.get('_meta_id'));

            me.winComment.show();
        }

    },


    /**
     * Executado pelo botao apply/disappy
     * Para ativar ou desativar um filtro basta chamar a funcao load ela
     * ja checa se tem filtro selecionado e se o botao de filtro esta ativo.
     */
    applyDisapplyFilter: function () {
        var me = this;

        me.loadObjects();
    },

    /**
     * Recebe um filter set e carrega a store
     * filterConditions, depois de carregar
     * seta na variavel filters a store de condicoes.
     * essa variavel vai ser usada no metodo loadObjects.
     * @param  {Target.model.FilterSet} filterset
     * caso filterset seja null ou um model vazio, limpa as variaveis de filtro e reload a store.
     */
    applyFilter: function (filterset) {
        // Baseado no Filterset selecionado
        var me = this,
            vm = me.getViewModel(),
            filterConditions = vm.getStore('filterConditions');

        if ((filterset) && (filterset.get('id') > 0)) {
            // Filtra a store de condicoes pelo id do filterset
            filterConditions.addFilter({
                property: 'filterset',
                value: filterset.get('id')
            });

            filterConditions.load({
                callback: function () {
                    // coloca uma copia da store de filtros na variavel filters
                    vm.set('filters', this);

                    // Carregar a lista de objetos.
                    me.loadObjects();
                }
            });
        } else {
            filterset = Ext.create('Target.model.FilterSet', {});

            vm.set('filterSet', filterset);
            vm.set('filters', null);

            // Se nao tiver filterset apenas reload na lista
            me.loadObjects();
        }

    },

    /**
     * Alterna a Visualizacao entre o modo Data Grid e Mosaic
     * @param  {Ext.button.Button} btn
     * @param  {boolean} state
     * Caso state = true Mosaic visivel.
     * Caso state = false Data Grid visivel
     * O icone do botao e alternado de acordo com o componente visivel
     */
    switchMosaicGrid: function (btn, state) {
        var me = this,
            cardpanel = me.lookup('ObjectCardPanel'),
            layout = cardpanel.getLayout();

        if (state) {
            // Mosaic Visivel
            // Data Grid Invisivel
            // Icone do botao deve ser o de grid
            btn.setIconCls('x-fa fa-th-list');
            layout.next();
        } else {
            // Mosaic Invisivel
            // Data Grid Visivel
            // Icone do botao deve ser o de mosaic
            btn.setIconCls('x-fa fa-th-large');
            layout.prev();
        }
    },

    onClickSaveAs: function () {
        var me = this,
            vm = me.getViewModel(),
            currentCatalog = vm.get('currentCatalog'),
            activeFilter = me.activeFilter;

        if (me.winSaveAs !== null) {
            me.winSaveAs.close();
            me.winSaveAs = null;
        }

        me.winSaveAs = Ext.create('Target.view.objects.SaveCatalogWindow', {});

        me.winSaveAs.setCurrentCatalog(currentCatalog, activeFilter);

        me.winSaveAs.show();

    },

    onClickCreateCutouts: function () {
        var me = this,
            vm = me.getViewModel(),
            objects = vm.getStore('objects'),
            currentSetting = vm.get('currentSetting'),
            currentCatalog = vm.get('currentCatalog');

        if (me.winCutout !== null) {
            me.winCutout.close();
            me.winCutout = null;
        }

        me.winCutout = Ext.create('Target.view.settings.CutoutJobForm', {
            modal: true,
            objectsCount: objects.getTotalCount()
        });

        me.winCutout.setCurrentProduct(currentCatalog);

        if ((currentSetting) && (currentSetting.get('id') > 0)) {
            me.winCutout.setCurrentSetting(currentSetting);
        }

        me.winCutout.show();

    },


    onClickDownload: function () {
        var me = this,
            vm = me.getViewModel(),
            currentCatalog = vm.get('currentCatalog'),
            activeFilter = me.activeFilter;

        if (me.winDownload !== null) {
            me.winDownload.close();
            me.winDownload = null;
        }

        me.winDownload = Ext.create('Target.view.objects.DownloadWindow', {});

        me.winDownload.setCurrentCatalog(currentCatalog);
        me.winDownload.setFilter(activeFilter.id);

        me.winDownload.show();

    },

    onSelectImageFormat: function (combo, record) {
        console.log('onSelectImageFormat(%o)', record);
        var me = this;

        me.loadCutouts();
    },

    loadCutouts: function () {
        // console.log("loadCutouts()")
        var me = this,
            vm = me.getViewModel(),
            cutoutJob = vm.get('cutoutJob'),
            imageFormat = vm.get('currentImageFormat'),
            cutouts = vm.getStore('cutouts'),
            temp, imgFormat, imgFilter;

        temp = imageFormat.get('name').split('_');
        imgFormat = temp[0];
        imgFilter = temp[1];

        cutouts.addFilter([{
            property: 'cjb_cutout_job',
            value: cutoutJob.get('id')
        }, {
            property: 'ctt_img_format',
            value: imgFormat
        }, {
            property: 'ctt_filter__filter',
            value: imgFilter
        }
        ]);

        cutouts.load({
            callback: function () {
                me.onLoadCutouts(cutouts);
            }
        });
    },

    /**
     * Apos a Store de cutout ser carregada,
     * executa o metodo do painel Mosaic
     * que vai criar a visualiação das imagens.
     */
    onLoadCutouts: function (store) {
        // console.log("onLoadCutouts(%o)", store);
        var me = this,
            mosaic = me.lookup('TargetMosaic');

        mosaic.loadMosaics();
    },

    onClickInfoCutoutJob: function () {
        var me = this,
            vm = me.getViewModel(),
            cutoutjob = vm.get('cutoutJob');

        if ((cutoutjob) && (cutoutjob.get('id') > 0)) {

            if (me.winCutoutjobInfo !== null) {
                me.winCutoutjobInfo.close();
                me.winCutoutjobInfo = null;
            }

            me.winCutoutjobInfo = Ext.create('Target.view.objects.CutoutJobDetailWindow', {
                // title: cutoutjob.get('cjb_display_name'),
                listeners: {
                    scope: me,
                    deletecutoutjob: 'onDeleteCutoutjob'
                }

            });

            me.winCutoutjobInfo.setCutoutjob(cutoutjob);

            me.winCutoutjobInfo.show();

        }
    },

    onDeleteCutoutjob: function (cutoutjob, window) {
        var me = this,
            combo = me.lookup('cmbCutoutJob'),
            store = combo.getStore(),
            vm = me.getViewModel(),
            cutouts = vm.getStore('cutouts'),
            mosaic = me.lookup('TargetMosaic');

        window.setLoading(true);

        store.remove(cutoutjob);

        store.sync({
            callback: function () {
                window.close();

                // Limpar o Mosaic
                cutouts.removeAll();
                cutouts.clearFilter(true);
                mosaic.removeAll(true);

                // Limpar a Combo
                combo.reset();

                window.setLoading(false);
            }
        });
    },

    onCutoutDblClick: function (record, imageSource, mosaic) {
        //console.log("onCutoutDblClick(%o, %o)", record, imageSource)

        url = imageSource;

        window.open(url, '_blank');
    },

    /**
     * Executado toda vez que o painel Mosaic
     * for ativado e ficar visivel.
     * Apos a ativação vai carregar a lista de cutoutJobs.
     * isso é feito para garantir que a combobox de jobs sempre estara atualizada.
     * @param  {Target.view.objects.Mosaic} panel Instancia do painel Mosaic.
     */
    onMosaicActivate: function (panel) {
        // console.log("onMosaicActivate(%o)", panel);
        var me = this,
            vm = me.getViewModel(),
            product = vm.get('currentCatalog');

        // Toda vez que o painel for ativado, carregar a lista de cutout jobs
        me.loadCutoutJobs(product.get('id'));
    },

    onClickRenameTargetList: function () {
        // Rename Target List
        var me = this,
            vm = me.getViewModel(),
            currentCatalog = vm.get('currentCatalog'),
            store = vm.getStore('catalogs');

        Ext.MessageBox.prompt(
            'Rename Target List',
            'Please enter the new name:',
            function (btn, text) {
                if (btn == 'ok') {
                    currentCatalog.set('prd_display_name', text)
                    currentCatalog.save({
                        success: function () {
                            Ext.toast({
                                html: 'Successfully Changed Record".',
                                closable: false,
                                align: 't',
                                slideInDuration: 400
                            });
                        },
                        failure: function (record, operation) {
                            var error = Ext.decode(operation.error.response.responseText)
                            Ext.MessageBox.alert('Failed to rename the list', error.prd_display_name[0]);
                        },
                        callback: function () {
                            store.load()
                        }
                    })
                } else {
                    this.close()
                }
            },
            this);
    },

});
