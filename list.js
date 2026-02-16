const html = String.raw;
export default {
  props: ["list", "show", "hideButtons"],
  data() {
    return {
      portfolioList: this.list,
    };
  },
  mounted() {
    document.addEventListener("mousedown", this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener("mousedown", this.handleClickOutside);
  },
  methods: {
    onClose() {
      console.log('AAAA');
      this.$emit("on-close");
    },
    onSelectPortfolio(id) {
      this.$emit("on-select", id);
    },
    onAddPortfolio() {
      this.$emit("on-add-portfolio");
    },
    onEditList() {
      this.$emit("on-edit-list");
    },
    handleClickOutside(event) {
      const parent = this.$refs.modal;
      if (this.show && parent && !parent.contains(event.target) && !event.target.closest('.cdf-modal')) {
        if (window.innerWidth > 768) {
            this.onClose();
        }
      }
    },
  },
  template: html`
    <div
      class="cdf-modal cdf-modal--small-on-mobile"
      :class="{'cdf-modal--show': show}"
      ref="modal"
    >
      <div class="cdf-modal-dialog cdf-modal-dialog--sm" @mousedown.self="onClose">
        <div class="cdf-modal-content">
          <div class="cdf-modal-header">
            <div class="cdf-modal-header__left">
              <div class="cdf-modal-title">Portfolio List</div>
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
            <div class="pf-card">
              <div class="pf-card-item" v-for="item in list" @click="onSelectPortfolio(item.id)">
                <div class="pf-card-item__left">
                  <div class="pf-icon pf-icon--color-1" :class="['pf-icon--color-' + item.color]">
                    {{ item.name_short }}
                  </div>
                </div>
                <div class="pf-card-item__content">
                  <div class="pf-card-item-name">{{ item.name }}</div>
                  <div class="pf-card-item-sub">
                    {{ item.number_of_assets }} assets
                  </div>
                </div>
                <div class="pf-card-item__right">
                  <div class="pf-card-item-total">
                    {{ item.current_balance }}
                  </div>
                  <div class="pf-card-item-sub" style="font-size: 0.75rem" :data-number-sign="item.total_profit_value" :data-number-no-sign>{{item.total_profit}}  {{item.total_profit_pct_formatted}}</div>
                </div>
              </div>
              <!-- .pf-list-item -->
            </div>
            <!-- .pf-list -->
          </div>
          <!-- .cdf-modal-body -->
          <div v-if="hideButtons !== true" class="cdf-modal-footer">
            <div class="cdf-grid cdf-grid--cols-2">
              <button class="cdf-btn" type="button" @click="onAddPortfolio">
                <svg class="cdf-btn-icon">
                  <use xlink:href="#plus-sign"></use>
                </svg>
                Add portfolio
              </button>
              <button class="cdf-btn" type="button" @click="onEditList">
                <svg class="cdf-btn-icon">
                  <use xlink:href="#menu"></use>
                </svg>
                Edit list
              </button>
            </div>
          </div>
          <!-- .cdf-modal-footer -->
        </div>
      </div>
      <!-- .cdf-modal-dialog -->
    </div>
    <!-- .cdf-modal -->
  `,
};
