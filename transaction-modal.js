import {
  addTransaction,
  balance,
  createPortfolio,
  updateTransaction,
} from "./api";

const html = String.raw;
function myDebounce(cb, ms) {
  let timer;
  return function doDebounce(...args) {
    var context = this;
    var args = arguments;
    clearTimeout(timer);
    timer = setTimeout(() => cb.apply(context, args), ms);
  };
}

function roundToSignificantDigits(num, digits = 4) {
    if (num === 0) return "0";
    
    const magnitude = Math.floor(Math.log10(Math.abs(num)));
    const factor = Math.pow(10, digits - 1 - magnitude);
    const rounded = Math.round(num * factor) / factor;
    
    const decimalPlaces = Math.max(0, digits - magnitude - 1);
    let result = rounded.toFixed(decimalPlaces);
    
    // Remove trailing zeros and unnecessary decimal point
    result = result.replace(/\.?0+$/, '');
    
    return result;
}

const QUOTE_ASSET_LIST = [
  { asset_type: 1, asset_id: 5134, name: "USDT" },
  { asset_type: 1, asset_id: 2012, name: "ETH" },
  { asset_type: 1, asset_id: 583, name: "BTC" },
  { asset_type: 0, asset_id: 1, name: "USD" },
];
const DEFAULT_QUOTE_ASSET = QUOTE_ASSET_LIST[0];
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
export default {
  props: ["show", "portfolioId", "transaction", "asset"],
  data() {
    return {
      priceType: 0,
      errors: [],
      quoteAssetList: QUOTE_ASSET_LIST,
      _accessToken: getAccessToken(),
      currentBalance: {},
      newPortfolioId: null,
      portfolioList: [],
      touchedFields: [],

      tx: {
        portfolio_id: this.portfolioId,
        type: 0,
        quantity: null,
        price_in_quote: null,
        total: null,

        base_asset_type: null,
        base_asset_id: null,
        base_asset: null,

        quote_asset: DEFAULT_QUOTE_ASSET,
        quote_asset_type: DEFAULT_QUOTE_ASSET.asset_type,
        quote_asset_id: DEFAULT_QUOTE_ASSET.asset_id,

        ts: Math.floor(Date.now() / 1000),
        related: false,
      },
    };
  },
  mounted() {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.onClose();
      }
    });
  },
  computed: {
    quoteAssetListFiltered() {
      if (this.base_asset_type === 2) {
        console.log('aa', this.quoteAssetList.filter(({ asset_type }) => asset_type === 0));
        return this.quoteAssetList.filter(({ asset_type }) => asset_type === 0)
      }
      return this.quoteAssetList;
    },
    hasOnBalance() {
      const key = `${this.tx.base_asset_type}_${this.tx.base_asset_id}`;
      console.log('HAS_ON_BALANCE', this.currentBalance, key);
      return this.currentBalance[key];
    },
    datetime: {
      get() {
        const date = new Date(this.tx.ts * 1000);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toISOString().slice(0, -8);
      },
      set(value) {
        this.tx.ts = Math.floor(new Date(value).getTime() / 1000);
      },
    },
    quoteAsset: {
      get() {
        const index = QUOTE_ASSET_LIST.findIndex(({ asset_type, asset_id }) => {
          return (
            asset_type == this.tx.quote_asset_type &&
            asset_id === this.tx.quote_asset_id
          );
        });
        // console.log('DEBUGG:quoteAsset', { index });
        return index;
      },
      set(value) {
        const asset = QUOTE_ASSET_LIST[value];
        this.tx.quote_asset_type = asset.asset_type;
        this.tx.quote_asset_id = asset.asset_id;
      },
    },
  },
  watch: {
    show(v) {
      if (!v) {
        return;
      }
      if (this.asset) {
        this.tx = {
          portfolio_id: this.portfolioId,
          type: 0,
          quantity: null,
          price_in_quote: null,
          total: null,

          base_asset_type: this.asset.type,
          base_asset_id: this.asset.id,
          base_asset: this.asset,

          quote_asset: DEFAULT_QUOTE_ASSET,
          quote_asset_type: DEFAULT_QUOTE_ASSET.asset_type,
          quote_asset_id: DEFAULT_QUOTE_ASSET.asset_id,

          ts: Math.floor(Date.now() / 1000),
          related: false,
        };
        this.errors = [];
        this.fetchPortfolioList();
        this.fetchBalance();
        this.fetchPrice();
        return;
      }

      const txx = this.transaction;
      if (txx) {
        console.log("DEBUGG:update", { txx });
        this.tx = {
          portfolio_id: this.portfolioId,
          type: txx ? txx.type : 0,
          quantity: txx ? txx.quantity : null,
          price_in_quote: txx ? txx.price_in_quote : null,
          total: roundToSignificantDigits(txx.quantity * txx.price_in_quote),

          base_asset_type: txx ? txx.base_asset_type : null,
          base_asset_id: txx ? txx.base_asset_id : null,
          base_asset: txx ? txx.base_asset : null,

          quote_asset: txx ? txx.quote_asset : DEFAULT_QUOTE_ASSET,
          quote_asset_type: txx
            ? txx.quote_asset_type
            : DEFAULT_QUOTE_ASSET.asset_type,
          quote_asset_id: txx
            ? txx.quote_asset_id
            : DEFAULT_QUOTE_ASSET.asset_id,

          ts: txx ? txx.tx_at : Math.floor(Date.now() / 1000),
          related: txx.related,
          relatedAllows: txx.relatedAllows,
        };
      } else {
        this.tx = {
          portfolio_id: this.portfolioId,
          type: 0,
          quantity: null,
          price_in_quote: null,
          total: null,

          base_asset_type: null,
          base_asset_id: null,
          base_asset: null,

          quote_asset: DEFAULT_QUOTE_ASSET,
          quote_asset_type: DEFAULT_QUOTE_ASSET.asset_type,
          quote_asset_id: DEFAULT_QUOTE_ASSET.asset_id,

          ts: Math.floor(Date.now() / 1000),
          related: false,
        };
      }
      this.errors = [];
      this.touchedFields = [];
      this.fetchBalance();
    },
    "tx.type": function () {
      this.errors = [];
    },
    "tx.ts": function (v) {
      console.log('on-change', new Date(v * 1000).toUTCString());
      this.fetchBalance();
    },
    // "tx.base_asset": function () {
    //   if (this.tx.base_asset) {
    //     this.fetchPrice();
    //   }
    // },
    // "tx.ts": function () {
    //   this.fetchPrice();
    // },
    // "tx.price_in_quote": function () {
    //   this.recalculateTotal();
    // },
    // "tx.quantity": function () {
    //   console.log("DEBUG:quantity", this.quantity);
    //   this.recalculateTotal();
    // },
    touchedFields(v) {
      console.log('TOUCHED:WATCH', v);
      const check = (...args) => args.every(item => v.includes(item));
      if (check('qt', 'total')) {
        console.log('TOUCHED:change', 'price');
      } else if (check('qt', 'price')) {
        console.log('TOUCHED:change', 'total');
      } else if (check('total', 'price')) {
        console.log('TOUCHED:change', 'qt');
      } else if (check('qt')) {
        console.log('TOUCHED:change', 'total');
      } else if (check('total')) {
        console.log('TOUCHED:change', 'qt');
      }
    },
  },

  methods: {
    setAllFromBalance() {
      if (this.hasOnBalance) {
        this.tx.quantity = this.hasOnBalance;
      }
    },
    updateTxTs(v) {
      this.tx.ts = v;
      this.fetchPrice();
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
      if (!this.tx.portfolio_id && this.asset && this.portfolioList.length) {
        console.log('BBBB', !this.tx.portfolio_id && this.asset && this.portfolioList.length);
        this.newPortfolioId = this.portfolioList[0].id;
      }
      return data;
    },
    onKeyDown(e) {
      console.log(e);
      if (e.key === "-" || e.key === "e") {
        e.preventDefault();
      }
    },
    onClose() {
      this.$emit("onClose");
    },
    check(...fields) {
      return fields.every(item => this.touchedFields.includes(item));
    },
    touchField(field) {
      const list = [...this.touchedFields];
      if (list[0] !== field) {
        list.unshift(field);
        if (list.length > 2) {
          list.pop();
        }
        this.touchedFields = list;
      }

      // const check = (...args) => args.every(item => this.touchedFields.includes(item));
      if (this.check('qt', 'total')) {
        // console.log('TOUCHED:change', 'price');
        this.recalculatePrice();
      } else if (this.check('qt', 'price')) {
        // console.log('TOUCHED:change', 'total');
        this.recalculateTotal();
      } else if (this.check('total', 'price')) {
        // console.log('TOUCHED:change', 'qt');
        this.recalculateQuantity();
      } else if (this.check('qt')) {
        // console.log('TOUCHED:change', 'total');
        this.recalculateTotal();
      } else if (this.check('total')) {
        // console.log('TOUCHED:change', 'qt');
        this.recalculateQuantity();
      }
    },
    onInputPriceInQuote() {
      // this.recalculateTotal();
      this.touchField('price');
      this.errors = [];
    },
    onInputQuantity() {
      // this.recalculateTotal();
      this.touchField('qt');
      this.errors = [];
    },
    onInputTxTotal() {
      // this.recalculatePrice();
      // this.recalculateQuantity();
      this.touchField('total');
      this.errors = [];
    },
    onChangeQuoteAsset() {
      this.fetchPrice();
    },
    onInputTs() {
      this.fetchPrice();
      this.errors = [];
    },
    onSelectAsset(asset) {
      this.tx.base_asset = asset;
      this.tx.base_asset_type = asset.type;
      this.tx.base_asset_id = asset.id;
      if (asset.type === 2) {
        this.tx.quote_asset = QUOTE_ASSET_LIST[3];
        this.tx.quote_asset_type = 0;
        this.tx.quote_asset_id = 1;
      }
      this.fetchPrice();
    },
    async fetchPrice() {
      const url = new URL("/en/api/portfolio/price", window.location.origin);
      url.searchParams.set("base_asset_id", this.tx.base_asset_id);
      url.searchParams.set("base_asset_type", this.tx.base_asset_type);
      url.searchParams.set("quote_asset_id", this.tx.quote_asset_id);
      url.searchParams.set("quote_asset_type", this.tx.quote_asset_type);
      url.searchParams.set("ts", this.tx.ts);
      const response = await fetch(url);
      const data = await response.json();
      this.tx.price_in_quote = data.result;
      this.tx.total = data.result * this.tx.quantity;
    },
    async fetchBalance() {
      console.log("DEBUGG:balance", this.portfolioId);
      if (!this.portfolioId) {
        return;
      }
      const response = await balance({
        portfolio_id: this.portfolioId,
        ts: this.tx.ts,
      });
      console.log("DEBUGG:balance", response);
      const data = await response.json();
      console.log("DEBUGG:blanace", data);
      this.currentBalance = data;
      // this.tx.price_in_quote = data.result;
    },
    async handleSubmit() {
      this.errors = [];
      if (!this.transaction) {
        let portfolioId = this.portfolioId || this.newPortfolioId;
        if (!portfolioId) {
          const portfolioResponse = await createPortfolio({
            name: "Auto created",
          });
          if (!portfolioResponse.ok) {
            return;
          } else {
            const portfolio = await portfolioResponse.json();
            portfolioId = portfolio.id;
            this.newPortfolioId = portfolio.id;
          }
        }
        const response = await addTransaction({
          type: this.tx.type,
          quantity: this.tx.quantity,
          price_in_quote: this.tx.price_in_quote,
          portfolio_id: portfolioId,
          base_asset_type: this.tx.base_asset_type,
          base_asset_id: this.tx.base_asset_id,
          quote_asset_type: this.tx.quote_asset_type,
          quote_asset_id: this.tx.quote_asset_id,
          // base_coin_id: this.asset.id,
          tx_at: this.tx.ts,
          related: this.tx.related,
        });
        if (response.ok) {
          this.$emit("on-create", true);
          if (this.asset) {
            const lang = window.location.pathname.split('/')[1];
            window.location.href = `/${lang}/portfolio-tracker/${portfolioId}`;
          }
          // const result = await response.json();
          // if (result.status === "ok") {
          //   console.log('AAAA');
          // } else {
          //   this.errors = result.errors;
          // }
        } else {
          if (response.status === 422) {
            this.errors = await response.json();
          }
          console.log(response);
          // const result = await response.json();
        }
        // console.log("DEBUG", response);
      } else {
        const response = await updateTransaction({
          id: this.transaction.id,
          quantity: this.tx.quantity,
          price_in_quote: this.tx.price_in_quote,
          tx_at: this.tx.ts,
          related: this.tx.related,
        });
        console.log("MYDE", response.ok);
        if (response.ok) {
          this.$emit("on-create", true);
        }
        // const response = await fetch(
        //   `/en/api/portfolio-tx/${this.transaction.id}?access_token=` +
        //     getToken(),
        //   {
        //     method: "PUT",
        //     headers: {
        //       Accept: "application/json",
        //       "Content-Type": "application/json",
        //     },
        //     body: JSON.stringify({
        //       quantity: this.quantity,
        //       price_in_quote: this.price,
        //       base_coin_id: this.asset.id,
        //       quote_coin_id: 5134,
        //       tx_at: this.ts,
        //       related: this.related,
        //     }),
        //   }
        // );
        // if (response.ok) {
        //   const result = await response.json();
        //   if (result.status === "ok") {
        //     this.$emit("on-create", true);
        //   } else {
        //     this.errors = result.errors;
        //   }
        // }
        // console.log("DEBUG", response);
        // this.$emit('on-update', true);
        // update
      }
      // this.$emit('on-submit', {
      //   type: this.type,
      //   // assetType: this.assetType,
      //   base_coin_id: this.asset.id,
      //   price: this.price,
      //   quantity: this.quantity,
      //   quote_coin_id: this.quoteCurrencyId,
      //   tx_at: this.timestamp,
      //   // total: this.total,
      // });
    },
    recalculateTotal() {
      if (this.tx.quantity && this.tx.price_in_quote) {
        const total = parseFloat(
          this.tx.quantity * this.tx.price_in_quote,
        );
        if (total < 0) {
          this.tx.total = roundToSignificantDigits(total, 4);
        } else {
          this.tx.total = +total.toFixed(2);
        }
        console.log(total);
      }
    },
    recalculatePrice() {
      if (this.tx.total && this.tx.quantity) {
        this.tx.price_in_quote = this.tx.total / this.tx.quantity;
      }
    },
    recalculateQuantity() {
      if (this.tx.total && this.tx.price_in_quote) {
        this.tx.quantity = this.tx.total / this.tx.price_in_quote;
      }
    },
  },
  template: html`
    <div
      class="cdf-modal cdf-modal--small-on-mobile"
      :class="{'cdf-modal--show': show}"
      @mousedown.self="onClose"
    >
      <div
        class="cdf-modal-dialog cdf-modal-dialog--sm"
        @mousedown.self="onClose"
      >
        <asset-list
          @on-close="onClose"
          @on-select="onSelectAsset"
          v-if="!tx.base_asset"
        ></asset-list>
        <!-- .cdf-modal-content -->
        <div class="cdf-modal-content" v-if="tx.base_asset">
          <div class="cdf-modal-header">
            <div class="cdf-modal-header__left">
              <div class="pf-modal-asset">
                <svg class="pf-modal-asset__back" @click="tx.base_asset = null">
                  <use xlink:href="#left-arrow"></use>
                </svg>
                <img
                  class="pf-modal-asset__img"
                  :src="'https://coindataflow.com/' + tx.base_asset.img"
                  alt=""
                />
                <div class="pf-modal-asset__title">
                  <div class="pf-modal-asset__symbol">
                    {{ tx.base_asset.symbol }}
                  </div>
                  <div class="pf-modal-asset__name">
                    {{ tx.base_asset.name }}
                  </div>
                </div>
              </div>
            </div>
            <div class="cdf-modal-header__right">
              <button
                class="cdf-modal-close-btn"
                type="button"
                @click="onClose"
              >
                <svg class="icon">
                  <use xlink:href="#close"></use>
                </svg>
              </button>
            </div>
          </div>
          <!-- .cdf-modal-header -->
          <div class="cdf-modal-body">
            <div class="cdf-modal-section" v-if="!transaction">
              <div class="cdf-radio">
                <div class="cdf-radio-item">
                  <input
                    class="cdf-radio-item__input"
                    id="txTypeBuy"
                    type="radio"
                    name="txType"
                    v-model="tx.type"
                    :value="0"
                    selected
                  />
                  <label class="cdf-radio-item__label" for="txTypeBuy">
                    Buy
                  </label>
                </div>
                <div class="cdf-radio-item">
                  <input
                    class="cdf-radio-item__input"
                    id="txTypeSell"
                    type="radio"
                    name="txType"
                    v-model="tx.type"
                    :value="1"
                  />
                  <label class="cdf-radio-item__label" for="txTypeSell">
                    Sell
                  </label>
                </div>
                <div class="cdf-radio-item">
                  <input
                    class="cdf-radio-item__input"
                    id="txTypeTransfer"
                    type="radio"
                    name="txType"
                    v-model="tx.type"
                    value="2"
                    disabled
                  />
                  <label class="cdf-radio-item__label" for="txTypeTransfer">
                    Transfer
                  </label>
                </div>
              </div>
            </div>
            <div v-if="asset" class="cdf-field">
              <div class="cdf-field__head">
                <label class="cdf-field-label">Portfolio</label>
              </div>
              <div class="cdf-field__body">
                <div class="cdf-field-input">
                  <div>{{tx.portfolio_id}}</div>
                  <select v-model="newPortfolioId" class="cdf-field-input__el">
                    <option :value="null">Create new portfolio</option>
                    <option v-for="pf in portfolioList" :value="pf.id">{{pf.name}}</option>
                  </select>
                  <div>
                  </div>
                </div>
              </div>
            </div>
            <div class="cdf-field">
              <div class="cdf-field__head">
                <label class="cdf-field-label"> Amount </label>
              </div>
              <div class="cdf-field__body">
                <div class="cdf-field-input">
                  <div></div>
                  <input
                    class="cdf-field-input__el"
                    v-model="tx.quantity"
                    @input="onInputQuantity"
                    type="number"
                    placeholder="0"
                    min="0"
                    @keydown="onKeyDown"
                  />
                  <div class="cdf-field-input__right">
                    <button v-if="tx.type == 1 && hasOnBalance" @click="setAllFromBalance" type="button" class="pf-unstyled-btn">all</button>
                    {{tx.base_asset.symbol}}
                  </div>
                </div>
              </div>
            </div>

            <div class="cdf-field">
              <div class="cdf-field__head">
                <label class="cdf-field-label"> Price </label>
              </div>
              <div class="cdf-field__body">
                <div class="cdf-field-input">
                  <div></div>
                  <input
                    class="cdf-field-input__el"
                    type="number"
                    v-model="tx.price_in_quote"
                    @input="onInputPriceInQuote"
                    @keydown="onKeyDown"
                    placeholder="0"
                  />
                  <div class="cdf-field-input__right">
                    <select v-model="quoteAsset" @change="onChangeQuoteAsset" class="pf-headless">
                      <option
                        :value="index"
                        v-for="(asset, index) in quoteAssetListFiltered"
                      >
                        {{ asset.name }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div class="cdf-field">
              <div class="cdf-field__head">
                <label class="cdf-field-label"> Date & Time </label>
              </div>
              <div class="cdf-field__body">
                <datetime-picker :model-value="tx.ts"  @update:model-value="updateTxTs"></datetime-picker>
                  <!--
                <div class="cdf-field-input">
                  <div></div>
                  <input
                    class="cdf-field-input__el"
                    type="datetime-local"
                    v-model="datetime"
                    @input="onInputTs"
                    :max="new Date().toISOString().split('T')[0] + 'T' + new Date().toISOString().split('T')[1].split(':').slice(0, 2).join(':')"
                  />
                  <div></div>
                </div>
                  -->
              </div>
            </div>

            <div class="cdf-field">
              <div class="cdf-field__head">
                <label class="cdf-field-label"> Total </label>
              </div>
              <div class="cdf-field__body">
                <div class="cdf-field-input">
                  <div></div>
                  <input
                    class="cdf-field-input__el"
                    v-model="tx.total"
                    @input="onInputTxTotal"
                    type="number"
                    @keydown="onKeyDown"
                    placeholder="0"
                  />

                  <div class="cdf-field-input__right">
                    {{ quoteAssetList[quoteAsset].name }}
                  </div>
                </div>
              </div>
            </div>
            <div v-if="tx.type == 0 && hasOnBalance">
              <input
                id="related"
                type="checkbox"
                v-model="tx.related"
                :disabled="transaction ? !tx.relatedAllows : false"
              />
              <label for="related"
                >Related (on balance {{ hasOnBalance }})</label
              >
            </div>
            <div v-if="transaction?.id || tx.type == 1">
              <input
                id="related"
                type="checkbox"
                v-model="tx.related"
                :disabled="transaction ? !tx.relatedAllows : false"
              />
              <label for="related">Related</label>
            </div>
            <div v-if="errors.length > 0" class="pf-error-alert">
              <ul>
                <li v-for="error in errors">{{ error.message }}</li>
              </ul>
            </div>
          </div>
          <!-- .cdf-modal-body -->
          <div class="cdf-modal-footer">
            <button
              class="cdf-btn cdf-btn--100w cdf-btn--prim"
              @click="handleSubmit"
            >
              <template v-if="transaction"> Edit transaction </template>
              <template v-if="!transaction"> Add transaction </template>
            </button>
          </div>
          <!-- .cdf-modal-footer -->
        </div>
      </div>
      <!-- .cdf-modal-dialog -->
    </div>
    <!-- .cdf-modal -->
  `,
};
