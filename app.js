const html = String.raw;
import { createApp } from "vue/dist/vue.esm-bundler";
import * as echarts from "echarts";
import CreatePortfolio from "./create";
import PortfolioList from "./list";
import ManageList from "./manage-list";
import ConfirmDeletePortfolio from "./confirm-delete-portfolio";
import ConfirmDeleteAsset from "./confirm-delete-asset";
import ConfirmDeleteTx from "./confirm-delete-tx";
import TransactionModal from "./transaction-modal";
import SettingsModal from "./settings";
import ShareModal from "./share";
import AssetList from "./assets-list";
import DateTimePicker from "./datetime-picker";
import { myDebounce } from "./utils";
import { deleteAsset, deleteTransaction, updatePortfolio } from "./api";

function getToken() {
  const tokenKey = "portfolioToken";
  const storedToken = localStorage.getItem(tokenKey);

  // Если токен уже существует в localStorage, вернуть его
  if (storedToken) {
    return storedToken;
  }

  // Если токена нет, сгенерировать новый и сохранить его в localStorage
  function generateRandomToken(length) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < length; i++) {
      token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return token;
  }

  const newToken = generateRandomToken(16);
  localStorage.setItem(tokenKey, newToken);

  return newToken;
}
function getAccessToken() {
  return getToken();
}

const PIE_CHART_COLORS = [
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#f9ca24",
  "#6c5ce7",
  "#fd79a8",
];

const wasLoggedIn = window.localStorage.getItem('_was_logged_in') !== null;
const isGuest = window._isGuest;
const portfolioPublicKey = window.portfolioPublicKey;

console.log("DEBUG", "INIT PROTFOLIO APP", { isGuest, wasLoggedIn, allow: !isGuest || (isGuest && !wasLoggedIn) });
export function initPortfolioApp() {
  const widgetConfig = {
    data() {
      return {
        allow: true,
        currentPortfolioId: null,
        portfolioList: [],
        showPortfolioList: false,
        _accessToken: getAccessToken(),
        currentTimeFrame: window.localStorage.getItem('currentTimeFrame') || '1y',
        tryNewPortfolioContent: window.tryNewPortfolioContent,
      };
    },
    mounted() {
      this.initApp();
      window.pfWidget = this;
    },
    computed: {
      currentPortfolioIconSymbol() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.name[0] : "E";
      },
      currentPortfolioName() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.name : "Empty portfolio";
      },
      currentPortfolioColor() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.color : 1;
      },
      currentPortfolioBalance() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.current_balance : "$0";
      },
      currentPortfolioTimeFrameChangePctRaw() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.time_frame_diff_pct : 0;
      },
      currentPortfolioTimeFrameChangePct() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.time_frame_diff_pct_formatted : "0%";
      },
    },
    watch: {
    },
    methods: {
      onSelectPortfolio(id) {
        this.currentPortfolioId = id;
        this.showPortfolioList = false;
        window.localStorage.setItem('wPortfolioId', this.currentPortfolioId);
      },
      async initApp() {
        const portfolioList = await this.fetchPortfolioList();
          console.log('AWESOME', portfolioList);
        if (portfolioList.length > 0 && !this.public_key) {
          const prevId = window.localStorage.getItem('wPortfolioId');
          if (prevId && portfolioList.find((item) => item.id == prevId)) {
            this.currentPortfolioId = +prevId;
          } else {
            this.currentPortfolioId = portfolioList[0].id;
            window.localStorage.setItem('wPortfolioId', this.currentPortfolioId);
          }
        }
        this.runRealtimeUpdate();
      },
      runRealtimeUpdate() {
        setInterval(() => {
          this.fetchPortfolioList();
        }, 1000 * 30);
      },
      async fetchPortfolioList() {
        const response = await fetch(`/en/api/portfolio?time_frame=${this.currentTimeFrame}`, {
          headers: {
            "X-Guest-Token": this._accessToken,
          },
          method: "GET",
        });
        if (response.status !== 200) {
          return;
        }
        const data = await response.json();
        this.portfolioList = data;
        return data;
      },
    },
    template: html`
      <div v-show="allow">
        <div class="pf-widget" @click="goTo">
          <a class="pf-widget-inside" :href="'/en/portfolio-tracker/' + (currentPortfolioId || 'new')">
            <div class="pf-widget__icon" :class="'pf-icon--color-' + currentPortfolioColor">
              {{ currentPortfolioIconSymbol }}
            </div>
            <div class="pf-widget__balance">
              {{ currentPortfolioBalance }}
            </div>
            <span class="pf-widget__change" :data-number-sign="currentPortfolioTimeFrameChangePctRaw">
              {{ currentPortfolioTimeFrameChangePct }}
            </span>
          </a>
          <div class="pf-widget__menu_el">
            <svg class="pf-widget__menu" @click="showPortfolioList = !showPortfolioList">
              <use xlink:href="#arrow-down"></use>
            </svg>
          </div>
        </div>
        <div class="pf-widget-down">
          <div class="pf-widget-down_inner">
            <portfolio-list :show="showPortfolioList" :list="portfolioList" @on-close="showPortfolioList = false" @on-select="onSelectPortfolio" :hide-buttons="true"></portfolio-list>
          </div>
          <a class="pf-widget-down_label" :href="'/en/portfolio-tracker/' + (currentPortfolioId || 'new')">
            {{ tryNewPortfolioContent }}
          </a>
        </div>
      </div>
    `,
  };
  const widget = createApp(widgetConfig);
  widget.component("portfolio-list", PortfolioList);
  widget.mount("#pf-widget");

  const widgetMob = createApp(widgetConfig);
  widgetMob.component("portfolio-list", PortfolioList);
  widgetMob.mount("#pf-widget-mobile");
  const app = createApp({
    data() {
      return {
        flashes: {},
        isGuest,
        public_key: portfolioPublicKey || '',
        allow: !isGuest || (isGuest && !wasLoggedIn),
        isInitFinish: false,
        isLoaded: false,
        _accessToken: getAccessToken(),
        portfolioList: [],
        showPortfolioList: false,
        currentPortfolioId: null,
        currentTimeFrame: window.localStorage.getItem('currentTimeFrame') || '1y',
        timeFrameList: [
          '24h',
          '7d',
          '1m',
          '3m',
          '6m',
          '1y',
          'ytd'
        ],
        txListCurrentPage: 1,
        txListPageCount: 1,
        showCreatePortfolioModal: false,
        showManageList: false,
        showDeletePortfolioModal: false,
        showDeleteAssetModal: false,
        showDeleteTxModal: false,
        showTransactionModal: false,
        showSettingsModal: false,
        showShareModal: false,
        mainChartLoading: false,
        currentTx: null,
        assets: [],
        transactions: [],
        pieLegend: [],
        currentPieChartItem: null,
        chart: [],
        chartPeriod: "7d",
        // activeChartButtonIndex: null,
        activeChartButtonIndex: window.localStorage.getItem('activeChartButtonIndex'),
        chartButtons: [
          {
            text: "24h",
            startIndex: null,
          },
          {
            text: "7d",
            startIndex: null,
          },
          {
            text: "1m",
            startIndex: null,
          },
          {
            text: "3m",
            startIndex: null,
          },
          {
            text: "6m",
            startIndex: null,
          },
          {
            text: "1y",
            startIndex: null,
          },
          {
            text: "ytd",
            startIndex: null,
          },
          {
            text: "all",
            startIndex: null,
          },
        ],
        lastiAmBack: +new Date(),
      };
    },
    mounted() {
      this.initApp();
      this.initCharts();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          console.log('ON:vis', document.visibilityState);
          this.iAmBack();
        }
      });
      window.addEventListener('focus', () => {
        console.log('VIS:focus');
        this.iAmBack();
      });
    },
    computed: {
      filteredAssets() {
        const assets = this.assets;
        if (!this.currentPortfolioShowSmallBalances) {
          return assets.filter((asset) => asset.total >= 10);
        }
        return assets;
      },
      chartButtonsFiltered() {
        return this.chartButtons.filter((button) => button.startIndex !== null);
      },
      txListPages() {
        if (this.txListPageCount > 1) {
          return Array.from({ length: this.txListPageCount }, (_, i) => i + 1);
        }
        return [];
      },
      currentPortfolio() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio || null;
      },
      currentPortfolioIconSymbol() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.name[0] : "E";
      },
      currentPortfolioDescription() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        console.log('DDEBUG', portfolio);
        return portfolio ? portfolio.description : null;
      },
      currentPortfolioName() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.name : "Empty portfolio";
      },
      currentPortfolioColor() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.color : 1;
      },
      currentPortfolioBalance() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.current_balance : "$0";
      },
      currentPortfolioBalanceValue() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.current_balance_value : null;
      },
      currentPortfolioTotalProfitValue() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.total_profit_value : 0;
      },
      currentPortfolioTotalProfit() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.total_profit : "$0";
      },
      currentPortfolioTotalProfit() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.total_profit : "$0";
      },
      currentPortfolioTotalProfitPct() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.total_profit_pct_formatted : "0%";
      },
      currentPortfolioRealizedProfitValue() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.realized_profit : 0;
      },
      currentPortfolioRealizedProfit() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.realized_profit_formatted : "$0";
      },
      currentPortfolioUnrealizedProfitValue() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.unrealized_profit : 0;
      },
      currentPortfolioUnrealizedProfit() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.unrealized_profit_formatted : "$0";
      },
      currentPortfolioTotalInvested() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.total_invested : "$0";
      },
      currentPortfolioTimeFrameChange() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.time_frame_diff : "$0";
      },
      currentPortfolioTimeFrameChangePctRaw() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.time_frame_diff_pct : 0;
      },
      currentPortfolioTimeFrameChangePct() {
        const portfolio = this.portfolioList.find(
          (p) => p.id === this.currentPortfolioId,
        );
        return portfolio ? portfolio.time_frame_diff_pct_formatted : "0%";
      },
      currentPortfolioShowSmallBalances: {
        get() {
          const portfolio = this.portfolioList.find(
            (p) => p.id === this.currentPortfolioId,
          );
          console.log(
            "GET",
            portfolio ? portfolio.show_small_balances : undefined,
          );
          return portfolio ? !!portfolio.show_small_balances : true;
        },
        set(newValue) {
          updatePortfolio({
            id: this.currentPortfolioId,
            show_small_balances: newValue,
          });
          const portfolio = this.portfolioList.find(
            (p) => p.id === this.currentPortfolioId,
          );
          portfolio.show_small_balances = newValue;
        },
      },
    },
    watch: {
      currentTimeFrame(val) {
        window.localStorage.setItem('currentTimeFrame', val);
        this.fetchPortfolioList();
        this.fetchAssets();
      },
      currentPortfolioId() {
        window.localStorage.setItem('portfolioId', this.currentPortfolioId);
        this.fetchAssets();
        this.fetchTransactions();
        // this.updateChart();
      },
      txListCurrentPage() {
        this.fetchTransactions();
      },
    },
    methods: {
      iAmBack: myDebounce(function () {
        console.log("I'm back");
        const now = new Date().getTime();
        const last = this.lastiAmBack;
        if (Math.floor((now - last) / 1000) > 60 * 5) {
          console.log("I'm back: let's update it");
          this.lastiAmBack = now;
          this.updateRangeChart();
        }
      }),
      roundToSignificantDigits(num, digits = 4) {
        if (num === 0) return "0";
        
        const magnitude = Math.floor(Math.log10(Math.abs(num)));
        const factor = Math.pow(10, digits - 1 - magnitude);
        const rounded = Math.round(num * factor) / factor;
        
        const decimalPlaces = Math.max(0, digits - magnitude - 1);
        let result = rounded.toFixed(decimalPlaces);
        
        // Remove trailing zeros and unnecessary decimal point
        result = result.replace(/\.?0+$/, '');
        
        return result;
      },
      flashIt(key, isUp) {
          const itm = (key in this.flashes)
              ? this.flashes[key] : {
                  timeoutId: undefined,
                  isUp: isUp,
              };

          itm.timeoutId && clearTimeout(itm.timeoutId);
          itm.isUp = isUp;
          itm.timeoutId = setTimeout(() => {
              itm.timeoutId = undefined;
              this.flashes[key] = {
                  timeoutId: undefined,
                  isUp: isUp,
              };
          }, 1000);
          this.flashes = {
              ...this.flashes,
              [key]: itm,
          };
      },
      getFlash(key, debug) {
          const itm = (key in this.flashes) && this.flashes[key];
          if (debug) {
              // console.log('DEBUG', itm && itm.timeoutId);
          }
          if (itm && itm.timeoutId) {
              return itm.isUp ? 'flash-up' : 'flash-down';
          }
          return undefined;
      },
      async delTx(item) {
        this.showDeleteTxModal = item.id;
        // await deleteTransaction({ id: item.id });
        // this.fetchTransactions();
        // this.fetchAssets();
        // this.fetchPortfolioList();
        // this.updateChart();
      },
      editTx(tx) {
        this.showTransactionModal = true;
        this.currentTx = tx;
        this.fetchTransactions();
      },
      onSelectPortfolio(id) {
        console.log(id);
        this.currentPortfolioId = id;
        this.showPortfolioList = false;
        const pathParts = window.location.pathname.split('/');
        pathParts[pathParts.length - 1] = this.currentPortfolioId;
        const newPath = pathParts.join('/');
        window.history.pushState(null, '', newPath);
      },
      async initApp() {
        const portfolioList = await this.fetchPortfolioList();
        if (portfolioList.length > 0) {
          if (this.public_key) {
              this.currentPortfolioId = portfolioList[0].id;
          } else {
            const url = window.location.pathname; // "/en/something/32"
            const lastElement = url.split('/').pop(); // "32"
            const prevId = !isNaN(lastElement) ? +lastElement : window.localStorage.getItem('portfolioId');
            console.log('DEBUGG', { prevId })
            if (prevId && portfolioList.find((item) => item.id == prevId)) {
              this.currentPortfolioId = +prevId;
            } else {
              this.currentPortfolioId = portfolioList[0].id;
              window.localStorage.setItem('portfolioId', this.currentPortfolioId);
            }
            const pathParts = window.location.pathname.split('/');
            if (pathParts[pathParts.length - 1] === 'portfolio-tracker') {
              pathParts.push(this.currentPortfolioId);
            } else {
              pathParts[pathParts.length - 1] = this.currentPortfolioId;
            }
            const newPath = pathParts.join('/');
            window.history.pushState(null, '', newPath);
            console.log("HH", this.currentPortfolioId);
          }
        }
        this.runRealtimeUpdate();
        this.isInitFinish = true;
      },
      runRealtimeUpdate() {
        setInterval(() => {
          this.fetchPortfolioList(true);
          this.fetchAssets(true);
        }, 1000 * 30);
      },
      async fetchPortfolioList(flashIt = false) {
        const response = await fetch(`/en/api/portfolio?time_frame=${this.currentTimeFrame}&public_key=${this.public_key}`, {
          headers: {
            "X-Guest-Token": this._accessToken,
          },
          method: "GET",
        });
        if (response.status !== 200) {
          return;
        }
        const data = await response.json();
        const oldBalanceValue = this.currentPortfolioBalanceValue;
        // if (flashIt) {
        //   const 
        // }
        this.portfolioList = data;
        const newBalanceValue = this.currentPortfolioBalanceValue;
        if (flashIt && oldBalanceValue != newBalanceValue) {
          console.log('flashIt');
          this.flashIt('currentBalance', newBalanceValue > oldBalanceValue);
        }
        return data;
      },
      onDelete(id) {
        this.showDeletePortfolioModal = id;
      },
      onEdit(portfolio) {
        this.showCreatePortfolioModal = portfolio;
      },
      onCloseCreatePortoflioModal() {
        this.showCreatePortfolioModal = false;
        if (!this.currentPortfolioId) {
          this.initApp();
        } else {
          this.fetchPortfolioList();
        }
      },
      confirmDeletePortfolio() {
        this.showDeletePortfolioModal = false;
        this.fetchPortfolioList();
      },
      confirmDeleteAsset() {
        this.showDeleteAssetModal = false;
        this.fetchAssets();
        this.fetchTransactions();
      },
      confirmDeleteTx() {
        this.showDeleteTxModal = false;
        this.fetchTransactions();
        this.fetchAssets();
        this.fetchPortfolioList();
        this.updateChart();
      },
      async fetchAssets(flashIt = false) {
        const response = await fetch(
          `/en/api/portfolio-asset/${this.currentPortfolioId}?time_frame=${this.currentTimeFrame}&public_key=${this.public_key}`,
          {
            headers: {
              "X-Guest-Token": this._accessToken,
            },
            method: "GET",
          },
        );
        if (response.status !== 200) {
          return;
        }
        const data = await response.json();
        if (flashIt) {
          data.forEach((item) => {
            const found = this.assets.find((el) => el.asset_id === item.asset_id)
            if (found && found.marketData.price_value != item.marketData.price_value) {
              this.flashIt(item.asset_id, item.marketData.price_value > found.marketData.price_value)
            }
          });
        }
        this.assets = data.sort((a, b) => b.total - a.total);
        this.initPieChart(data);
      },
      delAsset(item) {
        this.showDeleteAssetModal = item.id;
      },
      initPieChart(rawData) {
        // const data = rawData.filter(item => item.quantity > 0).map(item => ({
        //   value: item.total,
        //   val: item.total_formatted,
        //   name: item.asset.name,
        // }));
        const filteredData = rawData.filter((item) => item.quantity > 0);
        filteredData.sort((a, b) => b.total - a.total);
        const total = rawData.reduce((ttl, { total }) => ttl + total, 0);
        const finalData = filteredData.map((item) => ({
          ...item,
          pct: (item.total / total) * 100,
        }));
        const legend = finalData.reduce(
          (acc, item, index) => {
            if (item.pct > 2 && index < 6) {
              acc.top.push({
                ...item,
                name: item.asset.symbol,
                color: PIE_CHART_COLORS[index],
              });
            } else {
              acc.otherPct += item.pct;
              acc.otherTotal += item.total;
              acc.otherTotalFormatted = acc.otherTotal.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
              acc.other.push({
                ...item,
                name: item.asset.symbol,
                color: "gray",
              });
            }
            return acc;
          },
          {
            top: [],
            other: [],
            otherPct: 0,
            otherTotal: 0,
            otherTotalFormatted: "",
          },
        );
        this.currentPieChartItem = null;
        const data = [
          ...legend.top,
          {
            name: "Other assets",
            pct: legend.otherPct,
            color: "gray",
          },
        ].map((itm, index) => ({
          value: itm.pct,
          name: itm.name,
          itemStyle: {
            color: itm.color ? itm.color : PIE_CHART_COLORS[index],
          },
        }));
        this.pieLegend = legend;
        var chartDom = document.getElementById("pie-chart");
        this.pieChart = echarts.init(chartDom, null, {
          renderer: "svg",
          width: 268,
          hight: 268,
        });
        var option;

        option = {
          tooltip: {
            show: false,
            trigger: "item",
            formatter: "<b>{b}</b> ({d}%)",
          },
          legend: {
            show: false,
            orient: "vertical",
            bottom: "0",
          },
          series: [
            {
              // name: 'Access From',
              type: "pie",
              radius: ["60%", "90%"],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 0,
                borderColor: "rgba(0,0,0,0)",
                borderWidth: 3,
              },
              label: {
                show: false,
                position: "center",
                formatter: (a) => {
                  return "";
                  // console.log(a);
                  // console.log('DEBUGG', { a });
                  return a.data.name + "\n" + a.data.val + "\n";
                },
              },
              emphasis: {
                label: {
                  show: false,
                  show: true,
                  fontSize: 16,
                  fontWeight: "bold",
                },
              },
              labelLine: {
                show: false,
              },
              data: data
                ? data
                : [
                    { value: 1048, name: "Bitcoin" },
                    { value: 735, name: "TON" },
                    { value: 580, name: "ETH" },
                    { value: 484, name: "ADA" },
                    { value: 300, name: "AAPL" },
                  ],
            },
          ],
        };
        this.pieChart.on("mouseover", (params) => {
          // const legendItem = document.querySelector(
          //   `[data-index="${params.dataIndex}"]`,
          // );
          console.log(params.dataIndex);
          if (params.dataIndex < 6) {
            this.currentPieChartItem = legend.top[params.dataIndex];
          }
          // if (legendItem) {
          //   legendItem.classList.add("active");
          // }
        });

        option && this.pieChart.setOption(option);
      },
      onMouseEnterPie(index, asset) {
        if (index !== -1) {
          this.pieChart.dispatchAction({
            type: "highlight",
            seriesIndex: 0,
            dataIndex: index,
          });
        }
        this.currentPieChartItem = asset;
      },
      onMouseLeavePie(index, asset) {
        if (index !== -1) {
          this.pieChart.dispatchAction({
            type: "downplay",
            seriesIndex: 0,
            dataIndex: index,
          });
        }
        this.currentPieChartItem = asset;
      },
      async fetchTransactions() {
        const response = await fetch(
          `/en/api/portfolio-tx/${this.currentPortfolioId}?page=${this.txListCurrentPage}&public_key=${this.public_key}`,
          {
            headers: {
              "X-Guest-Token": this._accessToken,
            },
            method: "GET",
          },
        );
        if (response.status !== 200) {
          // throw new Error('MYERROR');
        }
        const data = await response.json();
        this.txListPageCount = +response.headers.get("x-pagination-page-count");
        this.transactions = data;
        // console.log('DEBUGG2', widget);
        this.updateChart();
        window.pfWidget.initApp();
      },
      initMainChart() {
        if (this.mainChart) return;
        this.mainChart = echarts.init(document.getElementById("main-chart"));
        window.addEventListener("resize", () => this.mainChart.resize());
      },
      initRangeChart() {
        if (this.rangeChart) return;
        this.rangeChart = echarts.init(document.getElementById("range-chart"));
        this.rangeChart.on("datazoom", this.onChangeZoom);
        window.addEventListener("resize", () => this.rangeChart.resize());
      },
      onChangeZoom: myDebounce(function (params) {
        // Get current zoom range
        const option = this.rangeChart.getOption();
        const dataZoom = option.dataZoom[0];

        // Calculate indices based on percentages
        const startIndex = Math.floor(
          (this.rangeChartData.length * dataZoom.start) / 100,
        );
        const endIndex =
          Math.ceil((this.rangeChartData.length * dataZoom.end) / 100) - 1;

        const startData = this.rangeChartData[startIndex];
        const endData = this.rangeChartData[endIndex];
        let startAt = startData.timestamp;
        let endAt = endData.timestamp;
        if (((endAt - startAt) / 60 / 60) < 24) {
          startAt = endAt - (60 * 60 * 24);
        }
        this.updateMainChart(startAt, endAt);

        // Update main chart with new range
        // updateMainChartWithRange(startIndex, endIndex);
      }, 500),
      initCharts() {
        this.initMainChart();
        this.initRangeChart();
      },
      updateChart() {
        this.$nextTick(() => {
          this.initCharts();
          // this.updateMainChart();
          this.updateRangeChart();
        });
      },
      async fetchChart(afterTs, beforeTs) {
        const response = await fetch(
          `/en/api/portfolio/${this.currentPortfolioId}/chart?afterTs=${afterTs}&beforeTs=${beforeTs}&public_key=${this.public_key}`,
          {
            headers: {
              "X-Guest-Token": this._accessToken,
            },
            method: "GET",
          },
        );
        if (response.status !== 200) {
          console.log("something went wrong");
          return;
        }
        const data = await response.json();
        this.chart = data;
        return data;
      },
      fix2Decimals(v) {
          return +((v).toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]);
      },
      asShortBigNumber(value) {
          const quintill = Math.pow(10, 18);
          const quadrill = Math.pow(10, 15);
          const trill = 1000000000000;
          const bill = 1000000000;
          const mill = 1000000;
          const thous = 1000;
          const number  = +value;
          let suffix = '';
          if (number >= quintill) {
              value = this.fix2Decimals(number / quintill);
              suffix = 'Quint';
          } else if (number >= quadrill) {
              value = this.fix2Decimals(number / quadrill);
              suffix = 'Quad';
          } else if (number >= trill) {
              value = this.fix2Decimals(number / trill);
              suffix = 'T';
          } else if (number >= bill) {
              value = this.fix2Decimals(number / bill);
              suffix = 'B';
          } else if (number >= mill) {
              value = this.fix2Decimals(number / mill);
              suffix = 'M';
          } else if (number >= thous) {
              value = this.fix2Decimals(number / thous);
              suffix = 'K';
          } else {
              value = this.fix2Decimals(number);
          }
          return `${value}${suffix}`;
      },
      async updateMainChart(afterTs, beforeTs) {
        // const beforeDate = new Date();
        // const beforeTs = Math.floor(beforeDate.getTime() / 1000);

        // const afterDate = new Date();
        // afterDate.setDate(afterDate.getDate() - 1);
        // const afterTs = Math.floor(afterDate.getTime() / 1000);
        this.mainChartLoading = true;
        // console.log('DEBUGG', { afterTs, beforeTs });
        const { chart, tx, txGroups = [] } = await this.fetchChart(
          afterTs,
          beforeTs,
        );
        this.mainChartLoading = false;
        const data = chart;
        const transactions = tx
          .filter((item) => {
            return item.timestamp * 1000 >= afterTs;
          })
          .map((item) => {
            const ts = +item.timestamp * 1000;
            const priceIndex = data.findIndex((d) => d[0] >= ts);
            const price = data[priceIndex - 1];
            // console.log('DDEBUG', priceIndex, price);
            return [ts, price ? price[1] : data[0][1]];
          });
        const txGroupsFiltered = txGroups.filter(
          // (item) => item.timestamp > afterTs,
          (item) => true,
        );
        // .map(item => [+item.timestamp * 1000, item.price])
        console.log(
          "DEBUG_chart_transactions",
          txGroups,
          txGroupsFiltered,
          afterTs,
        );
        this.mainChart.setOption({
          grid: {
            left: "55px",
            right: "16px",
            bottom: "6%",
            containLabel: false,
          },
          tooltip: {
            trigger: "axis",
            formatter: (params) => {
              // console.log('DEBUG_CHART_TOOLTIP', params);
              const date = new Date(params[0].value[0]);
              const price = params[0].value[1];
              const renderTx = [];
              if (params.length > 1) {
                const transactions = txGroupsFiltered.find(
                  (item) => item.timestamp === date.getTime() / 1000,
                );
                console.log("DEBUG_CHART_TOOLTIP", { transactions });
                if (transactions) {
                  transactions.tx.forEach((tx) => {
                    if (tx.type === 0) {
                      renderTx.push(`
                      <div class="portfolio-chart-tooltip_tx" data-type="buy">
                        <b>Buy <span>${tx.f_qt}</span></b> (${tx.f_money})
                      </div>
                    `);
                    } else {
                      renderTx.push(`
                      <div class="portfolio-chart-tooltip_tx" data-type="sell">
                        <b>Sell <span>${tx.f_qt}</span></b> (${tx.f_money})
                      </div>
                    `);
                    }
                  });
                }
              }
              // const priceFormat = new Intl.NumberFormat("en-US", {
              //   style: "currency",
              //   currency: "USD",
              // }).format(price);
              const priceFormat = `$${this.asShortBigNumber(+price.toFixed(0))}`;
              // console.log('DDDB',{ vv, price });
              // return date.toLocaleString() + '<br/>Balance: ' + price;
              return `
              <div class="portfolio-tooltip">
                ${renderTx.join("")}
                <div class="portfolio-chart-tooltip_balance">Balance: ${priceFormat}</div>
                <div class="portfolio-chart-tooltip_date">${date.toLocaleString()}</div>
              </div>
            `;
            },
          },
          xAxis: {
            type: "time",
            axisLabel: {
              hideOverlap: true,
              formatter: function (value) {
                const date = new Date(value);
                const diff = beforeTs - afterTs;
                if (diff <= 60 * 60 * 24 + 1) {
                  return date.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                } else if (diff <= 60 * 60 * 24 * 7 + 1) {
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                } else if (diff <= 60 * 60 * 24 * 360) {
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }
                return date.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
              },
            },
          },
          yAxis: {
            type: "value",
            axisLabel: {
              formatter: (value) => {
                const v = this.asShortBigNumber(value);
                return `$${v}`;
              },
            },
            // min: 'dataMin',
            scale: true
            // name: 'Price'
          },
          series: [
            {
              name: "Transactions",
              type: "scatter",
              data: txGroupsFiltered.map((item) => [
                +item.timestamp * 1000,
                item.price,
              ]), // transactions,
              symbolSize: 10,
              z: 2,
              itemStyle: {
                // color: "#ff5500",
                color: function (params) {
                  const ts = params.data[0] / 1000;
                  const txGroup = txGroupsFiltered.find(
                    (item) => item.timestamp === ts,
                  );
                  console.log('MAIN_CHART', { params, tx});
                  const action = txGroup ? txGroup.tx.reduce((acc, tx) => {
                    if (tx.type === 1 && (acc === 1 || acc === null)) {
                      acc = 1;
                    } else if (tx.type === 0 && (acc === 0 || acc == null)) {
                      acc = 0;
                    } else {
                      acc = -1;
                    }
                    return acc;
                  }, null) : -1;
                  
                  let color;
                  switch (action) {
                    case 1:
                      color = 'orangered';
                      break;
                    case 0:
                      color = 'lime';
                      break;
                    case -1:
                    default:
                      color = 'gray';
                  }
                  return color;
                },
              },
            },
            {
              name: "Price",
              type: "line",
              data: data.map(([ts, price]) => ([ts * 1000, price])),
              showSymbol: false,
              z: 1,
              lineStyle: {
                width: 2,
                color: '#067492',
              },
            },
          ],
        });
        this.mainChart.resize();
      },
      async updateRangeChart() {
        const beforeDate = new Date();
        const beforeTs = Math.floor(beforeDate.getTime() / 1000);

        const afterDate = new Date();
        afterDate.setMonth(afterDate.getMonth() - 5);
        const afterTs = Math.floor(afterDate.getTime() / 1000);
        const { chart: _data } = await this.fetchChart(0, beforeTs);
        const data = _data.map(([timestamp, price]) => ({ timestamp, price, amount: '0', formatted: new Date(timestamp * 1000).toLocaleDateString() }));
        this.rangeChartData = data;
        const date24h = new Date();
        date24h.setDate(date24h.getDate() - 1);

        const date7d = new Date();
        date7d.setDate(date7d.getDate() - 7);

        const date1m = new Date();
        date1m.setMonth(date1m.getMonth() - 1);

        const date3m = new Date();
        date3m.setMonth(date3m.getMonth() - 3);

        const date6m = new Date();
        date6m.setMonth(date6m.getMonth() - 6);

        const date1y = new Date();
        date1y.setMonth(date1y.getMonth() - 12);

        const dateYtd = new Date();
        dateYtd.setMonth(0);
        dateYtd.setDate(1);
        console.log("DEBUGG", { data });

        // const dateAll = new Date();
        // dateYtd.setMonth(dateYtd.getMonth() - 12);

        const buttons = [
          {
            text: "24h",
            startIndex: null,
          },
          {
            text: "7d",
            startIndex: null,
          },
          {
            text: "1m",
            startIndex: null,
          },
          {
            text: "3m",
            startIndex: null,
          },
          {
            text: "6m",
            startIndex: null,
          },
          {
            text: "1y",
            startIndex: null,
          },
          {
            text: "ytd",
            startIndex: null,
          },
          {
            text: "all",
            startIndex: null,
          },
        ];
        data.forEach((item, index) => {
          // console.log(item.timestamp);
          if (
            item.timestamp * 1000 >= +date24h &&
            buttons[0].startIndex === null
          ) {
            buttons[0].startIndex = index;
          }
          if (
            item.timestamp * 1000 >= +date7d &&
            buttons[1].startIndex === null
          ) {
            buttons[1].startIndex = index;
          }
          if (
            item.timestamp * 1000 >= +date1m &&
            buttons[2].startIndex === null
          ) {
            buttons[2].startIndex = index;
          }
          if (
            item.timestamp * 1000 >= +date3m &&
            buttons[3].startIndex === null
          ) {
            buttons[3].startIndex = index;
          }
          if (
            item.timestamp * 1000 >= +date6m &&
            buttons[4].startIndex === null
          ) {
            buttons[4].startIndex = index;
          }
          if (
            item.timestamp * 1000 >= +date1y &&
            buttons[5].startIndex === null
          ) {
            buttons[5].startIndex = index;
          }
          if (
            item.timestamp * 1000 >= +dateYtd &&
            buttons[6].startIndex === null
          ) {
            buttons[6].startIndex = index;
          }
        });
        console.log("DEBUG:BUTTONS", buttons);
        buttons[7].startIndex = 2;
        this.chartButtons = buttons;
        console.log(this.chartButtons, data.length);
        console.log("buttons", this.chartButtons);
        console.log("buttons_0", data[this.chartButtons[0].startIndex]);
        console.log("buttons_1", data[this.chartButtons[1].startIndex]);
        setTimeout(() => {
          if (this.activeChartButtonIndex === null || buttons[+this.activeChartButtonIndex].startIndex === null) {
            this.clickOnButton(7);
          } else {
            this.clickOnButton(+this.activeChartButtonIndex);
          }
        }, 500);
        // this.rangeChart.setOption({
        //           xAxis: {
        //               type: 'category',
        //               data: data.map(item => item.timestamp),
        //               boundaryGap: false,
        //               axisLabel: {
        //                   show: false
        //               },
        //               axisTick: {
        //                   show: false
        //               }
        //           },
        //           yAxis: {
        //               type: 'value',
        //               show: false
        //           },
        //           dataZoom: [{
        //               type: 'slider',
        //               xAxisIndex: 0,
        //               filterMode: 'filter',
        //               start: 70,
        //               end: 100,
        //               height: 20,
        //               bottom: 0,
        //               handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
        //               handleSize: '0%',
        //               showDetail: false
        //           }]
        // });
        this.rangeChart.setOption({
          grid: {
            left: "55px",
            right: "16px",
            bottom: 30,
            top: 5,
            containLabel: false,
          },
          xAxis: {
            type: "category",
            data: data.map((item) => item.formatted),
            axisLabel: {
              show: false,
            },
            axisTick: {
              show: false,
            },
            axisLine: {
              show: false,
            },
            splitLine: {
              show: false,
            },
          },
          yAxis: {
            type: "value",
            show: false,
            scale: true,
            splitLine: {
              show: false,
            },
          },
          series: [
            {
              // Empty series - we're hiding the data but keeping range functionality
              data: data.map((item) => item.price),
              type: "line",
              symbolSize: 0,
              lineStyle: {
                width: 0,
                opacity: 0,
              },
              itemStyle: {
                opacity: 0,
              },
              emphasis: {
                lineStyle: {
                  width: 0,
                },
              },
            },
          ],
          dataZoom: [
            {
              type: "slider",
              xAxisIndex: 0,
              filterMode: "filter",
              start: 70,
              end: 100,
              height: 46,
              bottom: 10,
              borderColor: "transparent",
              backgroundColor: "transparent",
              fillerColor: "rgba(167, 183, 204, 0.4)",
              handleSize: "80%",
            },
          ],
        });
        this.rangeChart.resize();
      },
      onCreateTx() {
        console.log("DEBUG: oncreate");
        this.showTransactionModal = false;
        this.currentTx = null;
        if (this.currentPortfolioId === null) {
          this.initApp();
        } else {
          this.fetchPortfolioList();
          this.fetchAssets();
          this.fetchTransactions();
        }
      },
      clickOnButton(index) {
        const button = this.chartButtons[index];
        window.localStorage.setItem('activeChartButtonIndex', index);
        this.activeChartButtonIndex = index;

        const item = this.rangeChartData[button.startIndex];
        // this.updateMainChart(item.timestamp, Math.floor(new Date().getTime() / 1000));
        const i = button.startIndex;
        const start = (i / this.rangeChartData.length) * 100;
        console.log(start);
        if (start === Infinity) {
          this.updateMainChart(0, +new Date());
          return;
        }
        this.rangeChart.dispatchAction({
          type: "dataZoom",
          start: start === Infinity ? 0 : start,
          end: 100,
          // Or use startValue/endValue instead
        });
      },
    },
  });
  app.component("asset-list", AssetList);
  app.component("datetime-picker", DateTimePicker);
  app.component("transaction-modal", TransactionModal);
  app.component("share-modal", ShareModal);
  app.component("settings-modal", SettingsModal);
  app.component("create-portfolio", CreatePortfolio);
  app.component("confirm-delete-portfolio", ConfirmDeletePortfolio);
  app.component("confirm-delete-asset", ConfirmDeleteAsset);
  app.component("confirm-delete-tx", ConfirmDeleteTx);
  app.component("manage-list", ManageList);
  app.component("portfolio-list", PortfolioList);
  // app.component('VueDatePicker', VueDatePicker);
  app.mount("#pf");
  // setTimeout(() => {
  //   app.mount('#pf');
  // }, 1000);
}
export function initPortfolioWidget() {
  const widget = createApp({
    data() {
      return {
        show: false,
        asset: null,
      };
    },
    mounted() {
      window.addEventListener('addAsset', this.handleExternalCall);
    },
    methods: {
      handleExternalCall(event) {
        console.log('handleExternalCall', event.detail.data);
        this.asset = event.detail.data;
        this.showPopup();
      },
      showPopup() {
        this.show = true;
      },
    },
    template: html`
      <transaction-modal :asset="asset" :show="show" @on-close="show = false" @on-create="show = flase"></transaction-modal>
    `,
  });
  widget.component("transaction-modal", TransactionModal);
  widget.component("asset-list", AssetList);
  widget.component("datetime-picker", DateTimePicker);
  widget.mount("#pf-add-asset");
  window._pfAsset = widget;
  console.log('widget', widget._component.methods);
}
