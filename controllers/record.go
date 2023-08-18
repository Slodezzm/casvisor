package controllers

import (
	"encoding/json"

	"github.com/beego/beego/utils/pagination"
	"github.com/casbin/casvisor/object"
	"github.com/casbin/casvisor/util"
)

// GetRecords
// @Title GetRecords
// @Tag Record API
// @Description get all records
// @Param   pageSize     query    string  true        "The size of each page"
// @Param   p     query    string  true        "The number of the page"
// @Success 200 {object} object.Record The Response object
// @router /get-records [get]
func (c *ApiController) GetRecords() {
	organization, ok := c.RequireAdmin()
	if !ok {
		//
		return
	}

	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")
	organizationName := c.Input().Get("organizationName")

	if limit == "" || page == "" {
		records, err := object.GetRecords()
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(records)
	} else {
		limit := util.ParseInt(limit)
		if c.IsGlobalAdmin() && organizationName != "" {
			organization = organizationName
		}
		filterRecord := &object.Record{Organization: organization}
		count, err := object.GetRecordCount(field, value, filterRecord)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		records, err := object.GetPaginationRecords(paginator.Offset(), limit, field, value, sortField, sortOrder, filterRecord)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(records, paginator.Nums())
	}
}

// GetRecord
// @Title GetRecord
// @Tag Record API
// @Description get record
// @Param   id     query    string  true        "The id ( owner/name ) of the record"
// @Success 200 {object} object.Record The Response object
// @router /get-record [get]
func (c *ApiController) GetRecord() {
	id := c.Input().Get("id")

	record, err := object.GetRecord(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(record)
}

// GetRecordsByFilter
// @Tag Record API
// @Title GetRecordsByFilter
// @Description get records by filter
// @Param   filter  body string     true  "filter Record message"
// @Success 200 {object} object.Record The Response object
// @router /get-records-filter [post]
func (c *ApiController) GetRecordsByFilter() {
	body := string(c.Ctx.Input.RequestBody)

	record := &object.Record{}
	err := util.JsonToStruct(body, record)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	records, err := object.GetRecordsByField(record)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(records)
}

// UpdateRecord
// @Title UpdateRecord
// @Tag Record API
// @Description update record
// @Param   id     query    string  true        "The id ( owner/name ) of the record"
// @Param   body    body   object.Record  true        "The details of the record"
// @Success 200 {object} controllers.Response The Response object
// @router /update-record [post]
func (c *ApiController) UpdateRecord() {
	id := c.Input().Get("id")

	var record object.Record
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &record)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.UpdateRecord(id, &record))
	c.ServeJSON()
}

// AddRecord
// @Title AddRecord
// @Tag Record API
// @Description add a record
// @Param   body    body   object.Record  true        "The details of the record"
// @Success 200 {object} controllers.Response The Response object
// @router /add-record [post]
func (c *ApiController) AddRecord() {
	var record object.Record
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &record)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.AddRecord(&record))
	c.ServeJSON()
}

// DeleteRecord
// @Title DeleteRecord
// @Tag Record API
// @Description delete a record
// @Param   body    body   object.Record  true        "The details of the record"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-record [post]
func (c *ApiController) DeleteRecord() {
	var record object.Record
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &record)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.DeleteRecord(&record))
	c.ServeJSON()
}
