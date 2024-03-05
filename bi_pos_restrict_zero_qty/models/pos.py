# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _


class PosConfig(models.Model):
	_inherit = "pos.config"

	restrict_zero_qty = fields.Boolean(string='Restrict Zero Quantity')
	warehouse_pos_id = fields.Many2one('stock.location', string='Warehouse POS ID')
	location_pos_id = fields.Many2one('stock.quant', string='Location POS ID')

