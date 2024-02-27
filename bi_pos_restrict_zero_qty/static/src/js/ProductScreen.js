// BiProductScreen js
odoo.define('bi_pos_restrict_zero_qty.productScreen', function(require) {
	"use strict";

	const Registries = require('point_of_sale.Registries');
	const ProductScreen = require('point_of_sale.ProductScreen');
	var rpc = require('web.rpc')

	const BiProductScreen = (ProductScreen) =>
		class extends ProductScreen {
			constructor() {
				super(...arguments);
			}

			async getQuantInfo(product_id) {
                try {
                    const quants = rpc.query({
                        model: 'stock.quant',
                        method: 'search_read',
                        args: [[['product_id', '=', product_id]], ['product_id', 'location_id', 'quantity']],
                    });
                    return quants; // Devuelve los datos obtenidos
                } catch (error) {
                    console.error('Error al obtener información de stock.quant:', error);
                    return null; // Devuelve null en caso de error
                }
            }


			async _onClickPay() {
				var self = this;
				let order = this.env.pos.get_order();
				console.log("Order: ", order);
				//leer stock_quants = this.env.pos
				let lines = order.get_orderlines();
				let pos_config = self.env.pos.config;
				let call_super = true;
				//let location_quantity = stock.quant;
				//console.log(location_quantity);
				var config_id=self.env.pos.config.id;

                    //x_warehouse_pos_id  -> many2one   stock.location
                //x_warehouse_id_2    -> many2one   stock.warehouse
                //x_location_pos_id   -> many2one   stock.quant
                //x_location_id_2     -> many2many  stock.quant
                //line.pdr.id
                var location_selected = pos_config.x_warehouse_pos_id[0];
                console.log("Location with stock: ", location_selected);

                //quant_info = http.request.env['stock.quant'].search([('product_id', '=', product_id)])

//				console.log("pos_config: ", pos_config);
//				let location_id = pos_config.x_warehouse_id_2[0] //2 (Naucalpan Estacas)
//				console.log("location_id: ", location_id);
//				console.log("warehose_id: ", pos_config.x_warehouse_id_2[1]);

				//let available_quantity_in_location = pos_config.x_location_pos_id.available_quantity;
				//console.log(available_quantity_in_location);

				let prod_used_qty = {};
				if(pos_config.restrict_zero_qty){
				//CAMBIAR $.EACH POR FOR TRADICIONAL PARA PODER USAR FUNCION ASINCRONA DENTRO
					//$.each(lines, function( i, line ){
					for (const line of lines) {
						let prd = line.product;

                        //START
                        let prd_id = prd.id;
                        var real_available_quantity;
                        // Método para obtener las cantidades específicas de almacenes
                        var quants = await this.getQuantInfo(prd_id);
                        console.log("Quants: ", quants);
                        try {
                            // Recorriendo el array de las locaciones
                            quants.forEach(obj => {
                                console.log(obj);
                                let location = obj.location_id[0];
                                if (location == location_selected) {
                                    console.log("Match");
                                    real_available_quantity = obj.quantity;
                                    console.log("real_available_quantity: ", real_available_quantity);
                                    throw "Found match"; // Excepción para salir del bucle
                                }
                            });
                        } catch (error) {
                            console.log(error);
                        }

                        console.log("line info: ", line);
                        console.log("real_available_quantity: ", real_available_quantity);
						if (prd.type == 'product'){
							if(prd.id in prod_used_qty){
                                console.log("inside if: prd.id in prod_used_qty?");
								let old_qty = prod_used_qty[prd.id][1];
								prod_used_qty[prd.id] = [real_available_quantity,line.quantity+old_qty]
							}else{
							    console.log("outside if: prd.id in prod_used_qty? ", prod_used_qty[prd.id]);
								prod_used_qty[prd.id] = [real_available_quantity,line.quantity]
								console.log("[available, required]**: ", prd.id.location_ids);

								//prod_used_qty[prd.id] = [prd.location_id(2).qty_available,line.quantity]
							}
						}
						 console.log("prd: ", prd);


						if(real_available_quantity <= 0){
							if (prd.type == 'product'){
								call_super = false;
								let wrning = prd.display_name + ' is out of stock.';
								self.showPopup('ErrorPopup', {
									title: self.env._t('Zero Quantity Not allowed'),
									body: self.env._t(wrning),
								});
							}
						}
                        //});
                        };

					$.each(prod_used_qty, function( i, pq ){
						let product = self.env.pos.db.get_product_by_id(i);
						let check = pq[0] - pq[1];
						console.log('pq: ', pq);
						let wrning = 'El siguiente producto no tiene stock suficiente: ' + product.display_name + '\n' +'Stock disponible: ' + pq[0] + '\n' +'Stock solicitado: ' + pq[1];
						if (product.type == 'product'){
							if (check < 0){
								call_super = false;
								self.showPopup('ErrorPopup', {
									title: self.env._t('Warning'),
									body: self.env._t(wrning),
								});
							}
						}
					});	
					
				}
				if(call_super){
					super._onClickPay();
				}
			}
		};

	Registries.Component.extend(ProductScreen, BiProductScreen);

	return ProductScreen;

});
