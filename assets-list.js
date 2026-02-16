import {myDebounce} from "./utils";

const html = String.raw;
const hasStock = window._portfolioStocksEnabled;
const AssetList = {
  data() {
    return {
      query: "",
      hasStock,
      list: [],
      type: 1,
      loading: false,
    };
  },
  watch: {
    query: myDebounce(function () {
      console.log('awesome query', this.query);
      this.fetchList();
    }, 500),
    type: myDebounce(function () {
      this.fetchList();
    }, 500),
  },
  mounted() {
    this.fetchList();
  },
  methods: {
    onClose() {
      this.$emit("onClose");
    },
    onSelect(asset) {
      this.$emit("onSelect", asset);
    },
    async fetchList() {
      this.loading = true;
      try {
        const response = await fetch(
          `/en/api/portfolio/assets?q=${this.query}&type=${this.type}`
        );
        const items = await response.json();
        this.list = items;
      } finally {
        this.loading = false;
      }
    },
  },
  template: html`
    <div class="cdf-modal-content">
      <div class="cdf-modal-header">
        <div class="cdf-modal-header__left">
          <div class="cdf-modal-title">Add asset</div>
        </div>
        <div class="cdf-modal-header__right">
          <button class="cdf-modal-close-btn" type="button" @click="onClose">
            <svg class="icon">
              <use xlink:href="#close"></use>
            </svg>
          </button>
        </div>
      </div>
      <!-- .cdf-modal-header -->
      <div class="cdf-modal-body">
        <div class="cdf-modal-section">
          <div class="cdf-radio" v-if="hasStock">
            <div class="cdf-radio-item">
              <input
                class="cdf-radio-item__input"
                id="assetTypeCrypto"
                type="radio"
                name="assetType"
                v-model="type"
                :value="1"
                selected
              />
              <label class="cdf-radio-item__label" for="assetTypeCrypto">
                Crypto
              </label>
            </div>
            <div class="cdf-radio-item">
              <input
                class="cdf-radio-item__input"
                id="assetTypeStock"
                type="radio"
                name="assetType"
                v-model="type"
                :value="2"
              />
              <label class="cdf-radio-item__label" for="assetTypeStock">
                Stock
              </label>
            </div>
          </div>
        </div>
        <div class="cdf-modal-section">
          <div class="cdf-field">
            <div class="cdf-field__body">
              <div class="cdf-field-input">
                <div
                  class="cdf-field-input__icon"
                  :class="{'cdf-field-input__icon--spin': loading}"
                >
                  <svg class="icon">
                    <use v-if="!loading" xlink:href="#search"></use>
                    <use v-if="loading" xlink:href="#loading"></use>
                  </svg>
                </div>
                <input
                  class="cdf-field-input__el"
                  v-model="query"
                  type="text"
                  placeholder="Search for Asset..."
                />
              </div>
            </div>
          </div>
          <ul class="pf-asset-list" v-if="list.length > 0">
            <li
              class="pf-asset-list-item"
              v-for="(asset, index) in list"
              @click="onSelect(asset)"
            >
              <img
                v-if="asset.img"
                class="pf-asset-list-item__img"
                :src="'https://coindataflow.com/' + asset.img"
                alt=""
              />
              <span class="pf-asset-list-item__title">
                <span class="pf-asset-list-item__symbol"
                  >{{ asset.symbol }}</span
                >
                <span class="pf-asset-list-item__name">{{ asset.name }}</span>
              </span>
            </li>
          </ul>
          <div
            class="pf-asset-list-not-found"
            v-if="list.length === 0"
          >
            <div class="pf-asset-list-not-found__icon">
              <svg class="pf-asset-list-not-found__svg">
                <use xlink:href="#not-found"></use>
              </svg>
            </div>
            <div class="pf-asset-list-not-found__text">No results found</div>
          </div>
        </div>
      </div>
    </div>
  `,
};
export default AssetList;
