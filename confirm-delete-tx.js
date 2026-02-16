import { deleteTransaction } from "./api";

const html = String.raw;
export default {
  props: ["show"],
  data() {
    return {
      loading: false,
      deleteRelatedTx: false,
      error: null,
    };
  },
  methods: {
    async onDelete() {
      this.loading = true;
      this.error = null;
      try {
        const res = await deleteTransaction({ id: this.show, deleteRelatedTx: this.deleteRelatedTx });
        if (res.status === 200) {
          this.$emit("on-close");
        } else {
          throw new Error("Failed to delete tx");
        }
      } catch (err) {
        this.error = `${err}`;
        console.log("Error", err);
      }
      this.loading = false;
    },
    onCancel() {
      this.error = null;
      this.loading = false;
      this.$emit("on-close");
    },
  },
  template: html`
    <div
      class="cdf-modal cdf-modal--small-on-mobile"
      :class="{'cdf-modal--show': show}"
    >
      <div
        class="cdf-modal-dialog cdf-modal-dialog--sm"
        @mousedown.self="onCancel"
      >
        <div class="cdf-modal-content">
          <div class="cdf-modal-header">
            <div class="cdf-modal-header__left">
              <div class="cdf-modal-title">Delete Transaction</div>
            </div>
            <div class="cdf-modal-header__right">
              <button
                class="cdf-modal-close-btn"
                type="button"
                @click="onCancel"
              >
                <svg class="icon">
                  <use xlink:href="#close"></use>
                </svg>
              </button>
            </div>
          </div>
          <!-- .cdf-modal-header -->
          <div class="cdf-modal-body">
            Are you sure you want to delete this transaction?
            <p>
            
            <input id="deleteRelatedTx" type="checkbox" v-model="deleteRelatedTx">
            <label for="deleteRelatedTx">Remove linked transactions</label>
</p>
            <div v-if="error" class="cdf-error-banner">{{ error }}</div>
          </div>
          <!-- .cdf-modal-body -->
          <div class="cdf-modal-footer">
            <div class="cdf-grid cdf-grid--cols-2">
              <button
                class="cdf-btn cdf-btn--danger"
                type="button"
                @click="onDelete"
                :disabled="loading"
              >
                <svg class="cdf-btn-icon">
                  <use xlink:href="#delete"></use>
                </svg>
                Delete Transaction
              </button>
              <button class="cdf-btn" type="button" @click="onCancel">
                Cancel
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
