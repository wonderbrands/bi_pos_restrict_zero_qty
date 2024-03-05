# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _


class PosConfig(models.Model):
	_inherit = "pos.config"

	restrict_zero_qty = fields.Boolean(string='Restrict Zero Quantity')
	warehouse_id = fields.Many2one('stock.warehouse', string='Warehouse POS ID')
	location_id = fields.Many2one('stock.location', string='Location POS ID')

	@api.onchange('warehouse_id')
	def onchange_warehouse_id(self):
		if self.warehouse_id:
			return {'domain': {
				'location_id': [('usage', '=', 'internal'), ('id', 'child_of', self.warehouse_id.view_location_id.id)]}}
		else:
			return {'domain': {'location_id': [('usage', '=', 'internal')]}}

	@api.onchange('location_id')
	def onchange_location_id(self):
		if self.location_id:
			domain = [('view_location_id', 'parent_of', self.location_id.id)]
			wh = self.env['stock.warehouse'].search(domain)
			return {'value': {
				'warehouse_id': wh.id}}

