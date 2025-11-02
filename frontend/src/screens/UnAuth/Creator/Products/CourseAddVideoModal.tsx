import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X } from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { updateVideo } from '../../../../store/VideoSlice';
import { Controller, useForm } from 'react-hook-form';
import CustomTextInput from '../../../../components/CustomInput';
import { Dropdown } from 'react-native-element-dropdown';

const CourseAddVideoModal = ({ onClose, videoData, getVideoById }) => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: videoData?.title,
      description: videoData?.description,
      is_free: videoData?.is_free,
      order: String(videoData?.order),
    },
  });

  const handleEdit = () => {
    setLoading(true);
    const payload = {
      videoId: videoData?.id,
      body: {
        title: videoData?.title,
        description: videoData?.description,
        is_free: videoData?.is_free,
        order: Number(videoData?.order),
      },
    };
    dispatch(updateVideo(payload))
      .unwrap()
      .then(response => {
        setLoading(false);
        onClose();
        getVideoById();
      })
      .catch(error => {
        console.log('----error---', error);
        setLoading(false);
      });
  };

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Update Video</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X color={colors.text} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.modalContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Video Title</Text>
        <Controller
          name="title"
          control={control}
          rules={{
            required: true,
          }}
          render={({
            field: { onChange, onBlur, value },
            fieldState: { error },
          }) => (
            <CustomTextInput
              inputContainerStyle={[
                styles.nameFields,
                {
                  borderColor: error ? 'red' : colors.borderColor,
                },
              ]}
              inputStyle={{
                fontSize: 16,
                color: colors.black,
              }}
              placeholderTextColor={colors.borderColor}
              placeholder="Enter video title"
              onChange={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />

        <Text style={styles.label}>Video Description</Text>
        <Controller
          name="description"
          control={control}
          rules={{
            required: true,
          }}
          render={({
            field: { onChange, onBlur, value },
            fieldState: { error },
          }) => (
            <CustomTextInput
              inputContainerStyle={[
                styles.nameFields,
                {
                  borderColor: error ? 'red' : colors.borderColor,
                },
              ]}
              inputStyle={{
                fontSize: 16,
                color: colors.black,
              }}
              placeholderTextColor={colors.borderColor}
              placeholder="Enter video description"
              onChange={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />

        <Text style={styles.label}>Video Order</Text>
        <Controller
          name="order"
          control={control}
          rules={{
            required: true,
          }}
          render={({
            field: { onChange, onBlur, value },
            fieldState: { error },
          }) => (
            <CustomTextInput
              inputContainerStyle={[
                styles.nameFields,
                {
                  borderColor: error ? 'red' : colors.borderColor,
                },
              ]}
              inputStyle={{
                fontSize: 16,
                color: colors.black,
              }}
              placeholderTextColor={colors.borderColor}
              placeholder="Enter video order"
              onChange={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />

        <Text style={styles.label}>Course Status</Text>
        <Controller
          control={control}
          name="is_free"
          rules={{ required: true }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <Dropdown
                style={[styles.dropdown, error && styles.errorBorder]}
                placeholderStyle={styles.placeholder}
                selectedTextStyle={styles.selectedText}
                containerStyle={{
                  borderRadius: 10,
                }}
                data={[
                  {
                    label: 'Yes',
                    value: true,
                  },
                  {
                    label: 'No',
                    value: false,
                  },
                ]}
                labelField="label"
                valueField="value"
                dropdownPosition="top"
                placeholder="Select status"
                value={value}
                onChange={item => onChange(item.value)}
                renderItem={item => {
                  const isSelected = item.value === value;
                  return (
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        margin: 10,
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.white,
                        borderRadius: 5,
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? colors.white : colors.primary,
                        }}
                      >
                        {item.label}
                      </Text>
                    </View>
                  );
                }}
              />
            </>
          )}
        />
      </ScrollView>

      <View style={styles.modalFooter}>
        <TouchableOpacity
          style={styles.cancelButton}
          disabled={loading}
          onPress={onClose}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            handleEdit();
          }}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>
            {loading ? (
              <ActivityIndicator color={colors.white} size={'small'} />
            ) : (
              'Update'
            )}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  placeholderSection: {
    backgroundColor: colors.lightGrey,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // paddingHorizontal: 20,
    // paddingVertical: 16,
    // borderTopWidth: 1,
    // borderTopColor: colors.border,
    gap: 15,
    marginHorizontal: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    // paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    paddingVertical: 10,
    // paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  nameFields: {
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
    width: '100%',
    backgroundColor: colors.white,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 6,
    color: '#333',
    fontWeight: '600',
  },
  dropdown: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    // marginTop: 20,
  },
  selectedText: {
    fontSize: 16,
    color: colors.primary,
  },
  placeholder: {
    fontSize: 16,
    color: colors.borderColor,
  },
  errorBorder: {
    borderColor: 'red',
  },
});

export default CourseAddVideoModal;
