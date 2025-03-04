// Copyright 2023 The casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from "react";
import {Link} from "react-router-dom";
import {Button, Progress, Table, Tag} from "antd";
import BaseListPage from "./BaseListPage";
import moment from "moment";
import * as Setting from "./Setting";
import * as AssetBackend from "./backend/AssetBackend";
import i18next from "i18next";
import PopconfirmModal from "./common/modal/PopconfirmModal";

class AssetListPage extends BaseListPage {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      intervalId: null,
    };
  }

  componentDidMount() {
    const id = setInterval(() => {
      this.fetch({pagination: this.state.pagination, searchedColumn: this.state.searchedColumn, searchText: this.state.searchText, sortField: this.state.sortField, sortOrder: this.state.sortOrder}, true);
    }, 1000);

    this.setState({intervalId: id});
  }

  componentWillUnmount() {
    if (this.state.intervalId !== null) {
      clearInterval(this.state.intervalId);
    }
  }

  fetchAssets = (params = {}) => {
    let field = params.searchedColumn, value = params.searchText;
    const sortField = params.sortField, sortOrder = params.sortOrder;
    if (params.category) {
      field = "category";
      value = params.category;
    } else if (params.type) {
      field = "type";
      value = params.type;
    }

    return AssetBackend.getAssets(
      Setting.getRequestOrganization(this.props.account),
      params.pagination.current,
      params.pagination.pageSize,
      field,
      value,
      sortField,
      sortOrder
    )
      .then((res) => {
        if (res.status === "ok") {
          return {
            data: res.data,
            total: res.data2,
          };
        } else {
          if (Setting.isResponseDenied(res)) {
            this.setState({isAuthorized: false});
          } else {
            Setting.showMessage("error", res.msg);
            throw new Error(res.msg);
          }
        }
      });
  };

  newAsset() {
    return {
      owner: this.props.account.owner,
      name: `machine_${this.state.data.length + 1}`,
      createdTime: moment().format(),
      displayName: `New Machine - ${this.state.data.length}`,
      category: "Machine",
      protocol: "rdp",
      ip: "127.0.0.1",
      port: 3389,
      username: "Administrator",
      password: "123",
      language: "zh",
      Os: "Windows",
      autoQuery: false,
      isPermanent: true,
      remoteApps: [],
      services: [],
    };
  }

  addAsset() {
    const newAsset = this.newAsset();
    AssetBackend.addAsset(newAsset)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push({pathname: `/assets/${newAsset.owner}/${newAsset.name}`, mode: "add"});
          Setting.showMessage("success", "Asset added successfully");
        } else {
          Setting.showMessage("error", `Failed to add Asset: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Asset failed to add: ${error}`);
      });
  }

  deleteAsset(i) {
    AssetBackend.deleteAsset(this.state.data[i])
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Asset deleted successfully");
          this.setState({
            data: Setting.deleteRow(this.state.data, i),
            pagination: {
              ...this.state.pagination,
              total: this.state.pagination.total - 1,
            },
          });
        } else {
          Setting.showMessage("error", `Failed to delete Asset: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Asset failed to delete: ${error}`);
      });
  }

  renderTable(assets) {
    const columns = [
      {
        title: i18next.t("general:Organization"),
        dataIndex: "owner",
        key: "owner",
        width: "110px",
        sorter: true,
        ...this.getColumnSearchProps("owner"),
        render: (text, asset, index) => {
          return (
            <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.props.account).replace("/account", `/organizations/${text}`)}>
              {text}
            </a>
          );
        },
      },
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "120px",
        sorter: true,
        ...this.getColumnSearchProps("name"),
        render: (text, record, index) => {
          return (
            <Link to={`/assets/${record.owner}/${record.name}`}>{text}</Link>
          );
        },
      },
      {
        title: i18next.t("general:Created time"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: "160px",
        sorter: (a, b) => a.createdTime.localeCompare(b.createdTime),
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("general:Display name"),
        dataIndex: "displayName",
        key: "displayName",
        width: "150px",
        sorter: (a, b) => a.displayName.localeCompare(b.displayName),
      },
      {
        title: i18next.t("general:Category"),
        dataIndex: "category",
        key: "category",
        width: "100px",
        filterMultiple: false,
        filters: [
          {text: "Machine", value: "Machine"},
          {text: "Database", value: "Database"},
        ],
        sorter: true,
        render: (text, record, index) => {
          return <Tag color={text === "Machine" ? "blue" : "green"}>{text}</Tag>;
        },
      },
      {
        title: i18next.t("general:Type"),
        dataIndex: "type",
        key: "type",
        width: "100px",
        sorter: true,
        filterMultiple: false,
        filters: Setting.getMachineTypes().concat(Setting.getDatabaseTypes()).map((item) => {return {text: item, value: item};}),
      },
      {
        title: i18next.t("general:Endpoint"),
        dataIndex: "endpoint",
        key: "endpoint",
        width: "120px",
      },
      {
        title: i18next.t("general:Port"),
        dataIndex: "port",
        key: "port",
        width: "90px",
      },
      {
        title: i18next.t("general:Username"),
        dataIndex: "username",
        key: "username",
        width: "130px",
        sorter: (a, b) => a.username.localeCompare(b.username),
      },
      {
        title: i18next.t("asset:CPU"),
        dataIndex: "cpuCurrent",
        key: "cpuCurrent",
        width: "150px",
        render: (text, record, index) => {
          if (!record.isActive || record.cpuCurrent === 0) {
            return "";
          }
          return <Progress steps={20} size={"small"}
            percent={(text).toFixed(2)}
          />;
        },
      },
      {
        title: i18next.t("asset:Memory"),
        dataIndex: "memory",
        key: "memory",
        width: "150px",
        render: (text, record, index) => {
          if (!record.isActive || record.memTotal === 0) {
            return "";
          }

          return <Progress steps={20} size={"small"}
            percent={(record.memCurrent * 100 / record.memTotal).toFixed(2)}
          />;
        },
      },
      {
        title: i18next.t("asset:Disk"),
        dataIndex: "disk",
        key: "disk",
        width: "150px",
        render: (text, record, index) => {
          if (!record.isActive || record.diskTotal === 0) {
            return "";
          }

          return <Progress steps={20} size={"small"}
            percent={(record.diskCurrent * 100 / record.diskTotal).toFixed(2)}
          />;
        },
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "300px",
        fixed: (Setting.isMobile()) ? "false" : "right",
        render: (text, record, index) => {
          return (
            <div>
              <Button
                disabled={!Setting.isAdminUser(this.props.account) && (record.owner !== this.props.account.owner)}
                style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}}
                type="primary"
                onClick={() => {
                  if (record.category === "Machine") {
                    const link = `access/${record.owner}/${record.name}`;
                    Setting.openLink(link);
                  } else if (record.category === "Database") {
                    const link = "databases";
                    Setting.openLink(link);
                  }
                }}
              >
                {i18next.t("general:Connect")}
              </Button>
              <Button
                disabled={record.category !== "Machine"}
                style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}}
                type="primary"
                onClick={() => {
                  const link = `/assets/${record.owner}/${record.name}/view`;
                  Setting.goToLink(link);
                }}
              >
                {i18next.t("asset:Files")}
              </Button>
              <Button
                disabled={!Setting.isAdminUser(this.props.account) && (record.owner !== this.props.account.owner)}
                style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}}
                onClick={() => this.props.history.push(`/assets/${record.owner}/${record.name}`)}
              >{i18next.t("general:Edit")}
              </Button>
              <PopconfirmModal
                disabled={!Setting.isAdminUser(this.props.account) && (record.owner !== this.props.account.owner)}
                title={i18next.t("general:Sure to delete") + `: ${record.name} ?`}
                onConfirm={() => this.deleteAsset(index)}
              >
              </PopconfirmModal>
            </div>
          );
        },
      },
    ];

    const paginationProps = {
      pageSize: this.state.pagination.pageSize,
      total: this.state.pagination.total,
      showQuickJumper: true,
      showSizeChanger: true,
      showTotal: () => i18next.t("general:{total} in total").replace("{total}", this.state.pagination.total),
    };

    return (
      <div>
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={assets} rowKey={(asset) => `${asset.owner}/${asset.name}`} size="middle" bordered pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("general:Assets")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" disabled={!Setting.isAdminUser(this.props.account)} onClick={this.addAsset.bind(this)}>{i18next.t("general:Add")}</Button>
            </div>
          )}
          loading={this.state.loading}
          onChange={this.handleTableChange}
        />
      </div>
    );
  }

  fetch = (params = {}, silent) => {
    let field = params.searchedColumn, value = params.searchText;
    const sortField = params.sortField, sortOrder = params.sortOrder;
    if (params.category) {
      field = "category";
      value = params.category;
    } else if (params.type) {
      field = "type";
      value = params.type;
    }
    if (!silent) {
      this.setState({loading: true});
    }
    AssetBackend.getAssets(Setting.getRequestOrganization(this.props.account), params.pagination.current, params.pagination.pageSize, field, value, sortField, sortOrder)
      .then((res) => {
        if (!silent) {
          this.setState({loading: false});
        }
        if (res.status === "ok") {
          this.setState({
            data: res.data,
            pagination: {
              ...params.pagination,
              total: res.data2,
            },
            searchText: params.searchText,
            searchedColumn: params.searchedColumn,
          });
        } else {
          if (Setting.isResponseDenied(res)) {
            this.setState({
              isAuthorized: false,
            });
          } else {
            Setting.showMessage("error", res.msg);
          }
        }
      });
  };
}

export default AssetListPage;
